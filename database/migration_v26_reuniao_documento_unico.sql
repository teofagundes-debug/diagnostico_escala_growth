-- V26 - Reunião Estratégica como documento único
alter table public.reunioes_estrategicas
  add column if not exists dados_reuniao jsonb not null default '{}'::jsonb;

-- Incorpora integralmente a preparação mais recente na própria reunião.
-- A tabela antiga é preservada somente como histórico de migração e deixa de ser usada pelo fluxo.
update public.reunioes_estrategicas r
set dados_reuniao = coalesce(r.dados_reuniao, '{}'::jsonb) || coalesce((
  select to_jsonb(pr)
  from public.preparacoes_reuniao pr
  where pr.reuniao_id = r.id
  order by pr.updated_at desc
  limit 1
), '{}'::jsonb)
where exists (
  select 1 from public.preparacoes_reuniao pr where pr.reuniao_id = r.id
);

comment on column public.reunioes_estrategicas.dados_reuniao is
  'Documento único da Reunião Estratégica: preparação interna, validações, decisões, parecer e observações do consultor.';

create index if not exists reunioes_estrategicas_diagnostico_data_idx
  on public.reunioes_estrategicas(diagnostico_id, data desc);
