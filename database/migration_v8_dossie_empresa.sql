-- Migração v8 ? Dossi? da Empresa e histórico contínuo
alter table public.empresas add column if not exists consultor_responsavel text default 'Teófilo Oliveira Fagundes';
alter table public.empresas add column if not exists observacoes_internas text;
alter table public.empresas add column if not exists proxima_missao jsonb default '{}'::jsonb;
alter table public.empresas add column if not exists meta_ieg integer default 85 check (meta_ieg between 0 and 100);
alter table public.empresas add column if not exists status_implantacao text default 'Não iniciada';

alter table public.diagnosticos add column if not exists registro_status text default 'Concluído';
alter table public.diagnosticos add column if not exists sequencia integer;
alter table public.diagnosticos add column if not exists tipo_avaliacao text;
alter table public.diagnosticos add column if not exists certificado_emitido boolean default false;
alter table public.diagnosticos add column if not exists certificado_emitido_em timestamptz;

alter table public.reunioes_estrategicas add column if not exists tipo text default 'Reunião Estratégica';

create table if not exists public.dossie_eventos(
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null references public.empresas on delete cascade,
 diagnostico_id uuid references public.diagnosticos on delete set null,
 tipo text not null,
 titulo text not null,
 descricao text,
 data_evento timestamptz default now(),
 concluido boolean default true,
 created_at timestamptz default now()
);
create index if not exists dossie_eventos_empresa_data_idx on public.dossie_eventos(empresa_id,data_evento desc);
alter table public.dossie_eventos enable row level security;

do $$ begin
 create policy "equipe autenticada le dossie" on public.dossie_eventos for select to authenticated using(true);
exception when duplicate_object then null; end $$;
do $$ begin
 create policy "equipe autenticada gerencia dossie" on public.dossie_eventos for all to authenticated using(true) with check(true);
exception when duplicate_object then null; end $$;

with numbered as (
 select id,row_number() over(partition by empresa_id order by data_diagnostico,created_at,id) as seq
 from public.diagnosticos
)
update public.diagnosticos d set
 sequencia=n.seq,
 tipo_avaliacao=case when n.seq=1 then 'Diagnóstico Inicial' else (n.seq-1)::text||'ª Reavaliação' end,
 registro_status=coalesce(d.registro_status,'Concluído')
from numbered n where d.id=n.id and (d.sequencia is null or d.tipo_avaliacao is null);

create or replace function public.duplicar_diagnostico_growth(original_id uuid) returns uuid language plpgsql security definer as $$
declare src public.diagnosticos%rowtype; novo_id uuid; nova_seq integer;
begin
 select * into src from public.diagnosticos where id=original_id;
 if src.id is null then raise exception 'Diagnóstico não encontrado'; end if;
 select coalesce(max(sequencia),0)+1 into nova_seq from public.diagnosticos where empresa_id=src.empresa_id;
 insert into public.diagnosticos(empresa_id,responsavel_id,data_diagnostico,pontuacao_geral,percentual_geral,nivel_maturidade,maior_pilar,menor_pilar,status,potencial_crescimento,parecer,plano_acao,certificado,relatorio_snapshot,registro_status,sequencia,tipo_avaliacao)
 values(src.empresa_id,src.responsavel_id,current_date,src.pontuacao_geral,src.percentual_geral,src.nivel_maturidade,src.maior_pilar,src.menor_pilar,'Diagnóstico Concluído',src.potencial_crescimento,src.parecer,src.plano_acao,'{}'::jsonb,src.relatorio_snapshot,'Ativo',nova_seq,(nova_seq-1)::text||'ª Reavaliação') returning id into novo_id;
 insert into public.respostas(diagnostico_id,pilar,pergunta,resposta_numerica) select novo_id,pilar,pergunta,resposta_numerica from public.respostas where diagnostico_id=original_id;
 insert into public.respostas_abertas(diagnostico_id,pergunta,resposta) select novo_id,pergunta,resposta from public.respostas_abertas where diagnostico_id=original_id;
 insert into public.resultados_pilares(diagnostico_id,pilar,pontuacao,percentual) select novo_id,pilar,pontuacao,percentual from public.resultados_pilares where diagnostico_id=original_id;
 insert into public.diagnostico_status_historico(diagnostico_id,status) values(novo_id,'Ativo');
 return novo_id;
end $$;

create or replace function public.registrar_diagnostico_growth(payload jsonb) returns uuid language plpgsql security definer as $$
declare e uuid; r uuid; d uuid; item jsonb; seq integer;
begin
 if nullif(payload->>'empresa_id','') is not null then e=(payload->>'empresa_id')::uuid; end if;
 if e is null then select id into e from public.empresas where lower(trim(nome))=lower(trim(payload->>'empresa')) order by created_at limit 1; end if;
 if e is null then insert into public.empresas(nome,segmento,cidade,estado) values(payload->>'empresa',payload->>'segmento',payload->>'cidade',payload->>'estado') returning id into e;
 else update public.empresas set segmento=coalesce(nullif(payload->>'segmento',''),segmento),cidade=coalesce(nullif(payload->>'cidade',''),cidade),estado=coalesce(nullif(payload->>'estado',''),estado),updated_at=now() where id=e; end if;
 select id into r from public.responsaveis where empresa_id=e and lower(email)=lower(payload->>'email') order by created_at limit 1;
 if r is null then insert into public.responsaveis(empresa_id,nome,email,telefone) values(e,payload->>'responsavel',payload->>'email',payload->>'telefone') returning id into r;
 else update public.responsaveis set nome=payload->>'responsavel',telefone=payload->>'telefone' where id=r; end if;
 select coalesce(max(sequencia),0)+1 into seq from public.diagnosticos where empresa_id=e;
 insert into public.diagnosticos(empresa_id,responsavel_id,data_diagnostico,pontuacao_geral,percentual_geral,nivel_maturidade,maior_pilar,menor_pilar,potencial_crescimento,status,parecer,plano_acao,certificado,relatorio_snapshot,registro_status,sequencia,tipo_avaliacao)
 values(e,r,(payload->>'data')::date,(payload->>'ieg')::int,(payload->>'ieg')::int,payload->>'nivel',payload->>'maior_forca',payload->>'maior_gargalo',payload->>'potencial','Diagnóstico Concluído',payload->>'parecer',payload->'plano_acao','{}'::jsonb,payload->'relatorio','Concluído',seq,case when seq=1 then 'Diagnóstico Inicial' else (seq-1)::text||'ª Reavaliação' end) returning id into d;
 for item in select * from jsonb_array_elements(payload->'radar') loop insert into public.resultados_pilares(diagnostico_id,pilar,pontuacao,percentual) values(d,item->>'label',(item->>'score')::int,(item->>'percent')::int); end loop;
 for item in select * from jsonb_array_elements(payload->'respostas') loop insert into public.respostas(diagnostico_id,pilar,pergunta,resposta_numerica) values(d,item->>'pilar',item->>'pergunta',(item->>'valor')::int); end loop;
 for item in select * from jsonb_array_elements(payload->'respostas_abertas') loop insert into public.respostas_abertas(diagnostico_id,pergunta,resposta) values(d,item->>'pergunta',item->>'resposta'); end loop;
 insert into public.diagnostico_status_historico(diagnostico_id,status) values(d,'Diagnóstico Concluído');
 insert into public.planos_estrategicos(empresa_id,diagnostico_id,resumo,situacao_atual,objetivos,prioridades,riscos,proximos_passos) values(e,d,payload->>'parecer',payload->>'nivel',payload->>'objetivos',payload->>'prioridades',payload->>'riscos',payload->>'proximos_passos');
 return d;
end $$;
