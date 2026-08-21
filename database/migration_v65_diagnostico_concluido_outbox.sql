-- V65 - Outbox transacional do evento diagnostico_concluido.
-- Aditiva: não altera diagnósticos nem eventos históricos.

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_version integer not null default 1,
  aggregate_type text not null,
  aggregate_id uuid not null,
  company_id uuid references public.empresas(id) on delete set null,
  payload jsonb not null,
  idempotency_key text not null unique,
  status text not null default 'PENDING'
    check (status in ('PENDING','PROCESSING','DELIVERED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  last_http_status integer,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists integration_events_dispatch_idx
  on public.integration_events(status,next_attempt_at,created_at);
create index if not exists integration_events_aggregate_idx
  on public.integration_events(aggregate_type,aggregate_id);

alter table public.integration_events enable row level security;

comment on table public.integration_events is
  'Outbox transacional de integrações externas. A service role realiza o despacho.';
comment on column public.integration_events.idempotency_key is
  'Identidade estável do evento utilizada para impedir criação duplicada e permitir deduplicação no receptor.';

create or replace function public.claim_integration_events(p_limit integer default 10)
returns setof public.integration_events
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with eligible as (
    select id
    from public.integration_events
    where event_type = 'diagnostico_concluido'
      and ((status = 'PENDING' and next_attempt_at <= now())
        or (status = 'PROCESSING' and locked_at < now() - interval '5 minutes'))
    order by created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,10),50))
  )
  update public.integration_events event
  set status = 'PROCESSING',
      locked_at = now()
  from eligible
  where event.id = eligible.id
  returning event.*;
end $$;

revoke all on function public.claim_integration_events(integer) from public, anon, authenticated;
grant execute on function public.claim_integration_events(integer) to service_role;

create or replace function public.registrar_diagnostico_growth(payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  e uuid;
  r uuid;
  d uuid;
  item jsonb;
  seq integer;
  event_id uuid := gen_random_uuid();
  event_created_at timestamptz := clock_timestamp();
  persisted_company public.empresas%rowtype;
  persisted_contact public.responsaveis%rowtype;
  persisted_diagnostic public.diagnosticos%rowtype;
  strategic_direction jsonb;
  event_payload jsonb;
begin
 if nullif(payload->>'empresa_id','') is not null then e=(payload->>'empresa_id')::uuid; end if;
 if e is null then select id into e from public.empresas where lower(trim(nome))=lower(trim(payload->>'empresa')) order by created_at limit 1; end if;
 if e is null then
  insert into public.empresas(nome,segmento,cidade,estado) values(payload->>'empresa',payload->>'segmento',coalesce(payload->>'cidade',payload->>'city'),coalesce(payload->>'estado',payload->>'state')) returning id into e;
 else
  update public.empresas set segmento=coalesce(nullif(payload->>'segmento',''),segmento),cidade=coalesce(nullif(coalesce(payload->>'cidade',payload->>'city'),''),cidade),estado=coalesce(nullif(coalesce(payload->>'estado',payload->>'state'),''),estado),updated_at=now() where id=e;
 end if;
 select id into r from public.responsaveis where empresa_id=e and lower(email)=lower(payload->>'email') order by created_at limit 1;
 if r is null then insert into public.responsaveis(empresa_id,nome,email,telefone) values(e,payload->>'responsavel',payload->>'email',payload->>'telefone') returning id into r;
 else update public.responsaveis set nome=payload->>'responsavel',telefone=payload->>'telefone' where id=r; end if;
 select coalesce(max(sequencia),0)+1 into seq from public.diagnosticos where empresa_id=e;
 insert into public.diagnosticos(empresa_id,responsavel_id,data_diagnostico,pontuacao_geral,percentual_geral,nivel_maturidade,maior_pilar,menor_pilar,potencial_crescimento,status,parecer,plano_acao,certificado,relatorio_snapshot,registro_status,sequencia,tipo_avaliacao,contexto_operacional,versao_diagnostico)
 values(e,r,(payload->>'data')::date,(payload->>'ieg')::int,(payload->>'ieg')::int,payload->>'nivel',payload->>'maior_forca',payload->>'maior_gargalo',payload->>'potencial','Diagnóstico Concluído',payload->>'parecer',payload->'plano_acao','{}'::jsonb,payload->'relatorio','Concluído',seq,case when seq=1 then 'Diagnóstico Inicial' else (seq-1)::text||'ª Reavaliação' end,payload->'contexto_operacional',payload->>'versao_diagnostico') returning id into d;
 for item in select * from jsonb_array_elements(coalesce(payload->'radar','[]'::jsonb)) loop insert into public.resultados_pilares(diagnostico_id,pilar,pontuacao,percentual) values(d,item->>'label',(item->>'score')::int,(item->>'percent')::int); end loop;
 for item in select * from jsonb_array_elements(coalesce(payload->'respostas','[]'::jsonb)) loop insert into public.respostas(diagnostico_id,pilar,pergunta,resposta_numerica) values(d,item->>'pilar',item->>'pergunta',(item->>'valor')::int); end loop;
 for item in select * from jsonb_array_elements(coalesce(payload->'respostas_abertas','[]'::jsonb)) loop insert into public.respostas_abertas(diagnostico_id,pergunta,resposta) values(d,item->>'pergunta',item->>'resposta'); end loop;
 insert into public.diagnostico_status_historico(diagnostico_id,status) values(d,'Diagnóstico Concluído');
 insert into public.planos_estrategicos(empresa_id,diagnostico_id,resumo,situacao_atual,objetivos,prioridades,riscos,proximos_passos) values(e,d,payload->>'parecer',payload->>'nivel',payload->>'objetivos',payload->>'prioridades',payload->>'riscos',payload->>'proximos_passos');

 select * into persisted_company from public.empresas where id=e;
 select * into persisted_contact from public.responsaveis where id=r;
 select * into persisted_diagnostic from public.diagnosticos where id=d;
 strategic_direction := coalesce(persisted_diagnostic.relatorio_snapshot #> '{indicadores_derivados,direcao_estrategica}','{}'::jsonb);

 event_payload := jsonb_build_object(
   'event_id',event_id,
   'event_type','diagnostico_concluido',
   'event_version',1,
   'occurred_at',event_created_at,
   'idempotency_key','diagnostico_concluido:'||d,
   'diagnostico',jsonb_build_object(
     'id',persisted_diagnostic.id,
     'empresa_id',persisted_diagnostic.empresa_id,
     'responsavel_id',persisted_diagnostic.responsavel_id,
     'status',persisted_diagnostic.status,
     'ieg',persisted_diagnostic.percentual_geral,
     'nivel',persisted_diagnostic.nivel_maturidade,
     'maior_forca',persisted_diagnostic.maior_pilar,
     'maior_gargalo',persisted_diagnostic.menor_pilar,
     'pilares',jsonb_build_object(
       'atrair',coalesce((select max(percentual) from public.resultados_pilares where diagnostico_id=d and lower(trim(pilar))='atrair'),0),
       'organizar',coalesce((select max(percentual) from public.resultados_pilares where diagnostico_id=d and lower(trim(pilar))='organizar'),0),
       'acompanhar',coalesce((select max(percentual) from public.resultados_pilares where diagnostico_id=d and lower(trim(pilar))='acompanhar'),0),
       'converter',coalesce((select max(percentual) from public.resultados_pilares where diagnostico_id=d and lower(trim(pilar))='converter'),0),
       'crescer',coalesce((select max(percentual) from public.resultados_pilares where diagnostico_id=d and lower(trim(pilar))='crescer'),0)
     ),
     'direcao_estrategica',jsonb_build_object(
       'direcao',coalesce(strategic_direction->>'strategic_direction',''),
       'prioridade_principal',coalesce(strategic_direction->>'primary_priority',''),
       'movimento_aquisicao',coalesce(strategic_direction->>'acquisition_movement','')
     )
   ),
   'contato',jsonb_build_object(
     'nome',coalesce(persisted_contact.nome,''),
     'email',coalesce(persisted_contact.email,''),
     'whatsapp',coalesce(persisted_contact.telefone,'')
   ),
   'empresa',jsonb_build_object(
     'nome',coalesce(persisted_company.nome,''),
     'segmento',coalesce(persisted_company.segmento,''),
     'cidade',coalesce(persisted_company.cidade,''),
     'estado',coalesce(persisted_company.estado,'')
   ),
   'nimble_intent',jsonb_build_object(
     'tag','diagnostico_realizado',
     'target_stage','Diagnóstico',
     'create_contact_if_missing',true,
     'create_deal_if_missing',true
   )
 );

 insert into public.integration_events(
   id,event_type,event_version,aggregate_type,aggregate_id,company_id,payload,
   idempotency_key,status,next_attempt_at,created_at
 ) values (
   event_id,'diagnostico_concluido',1,'diagnostico',d,e,event_payload,
   'diagnostico_concluido:'||d,'PENDING',event_created_at,event_created_at
 ) on conflict(idempotency_key) do nothing;

 return d;
end $$;
