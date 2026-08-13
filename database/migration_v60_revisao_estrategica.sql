-- V60 - Revisao Estrategica versionada, sem reabrir reunioes concluidas.
alter table public.reunioes_estrategicas
  add column if not exists revisao_origem_id uuid references public.reunioes_estrategicas(id) on delete set null,
  add column if not exists revisao_numero integer,
  add column if not exists revisao_motivo text,
  add column if not exists revisao_criada_por text,
  add column if not exists revisao_criada_em timestamptz;

create index if not exists reunioes_estrategicas_revisao_origem_idx
  on public.reunioes_estrategicas(revisao_origem_id, revisao_numero);

alter table public.strategic_execution_plans
  add column if not exists revisao_estrategica_id uuid references public.reunioes_estrategicas(id) on delete set null;

create index if not exists strategic_execution_plans_revisao_idx
  on public.strategic_execution_plans(revisao_estrategica_id);

comment on column public.reunioes_estrategicas.revisao_origem_id is
  'Rodada estrategica anterior preservada como historico imutavel.';
comment on column public.strategic_execution_plans.revisao_estrategica_id is
  'Revisao estrategica que originou esta versao do Plano Executavel.';

notify pgrst, 'reload schema';
