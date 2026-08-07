-- Diagnóstico 3.0 — Briefing do Consultor
-- A migration é aditiva e preserva integralmente diagnósticos anteriores.

alter table public.diagnosticos
  add column if not exists contexto_operacional jsonb,
  add column if not exists versao_diagnostico text;

comment on column public.diagnosticos.contexto_operacional is
  'Informações contextuais que não participam do cálculo do IEG.';
comment on column public.diagnosticos.versao_diagnostico is
  'Versão do formulário utilizada na coleta do diagnóstico.';

create or replace function public.registrar_diagnostico_growth(payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare e uuid; r uuid; d uuid; item jsonb; seq integer;
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
 return d;
end $$;
