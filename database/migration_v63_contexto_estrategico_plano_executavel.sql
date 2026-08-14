-- V63 - Contexto estratégico canônico dos novos Planos Executáveis
-- Não atualiza registros existentes nem snapshots publicados.
alter table public.strategic_execution_plans
  add column if not exists strategic_context_snapshot jsonb,
  add column if not exists strategic_action_plan_snapshot jsonb,
  add column if not exists priority_coverage_justification text;

alter table public.strategic_execution_plan_actions
  add column if not exists strategic_dimension text;

alter table public.strategic_execution_plan_actions
  drop constraint if exists strategic_execution_plan_actions_dimension_check,
  add constraint strategic_execution_plan_actions_dimension_check
    check (strategic_dimension is null or strategic_dimension in ('ATRAIR','ABSORVER','CONVERTER','GERIR'));

comment on column public.strategic_execution_plans.strategic_context_snapshot is
  'Contexto estratégico vigente e imutável da revisão que originou o DRAFT.';
comment on column public.strategic_execution_plans.strategic_action_plan_snapshot is
  'Ações canônicas calculadas no mesmo contexto estratégico vigente do plano.';
comment on column public.strategic_execution_plans.priority_coverage_justification is
  'Justificativa explícita quando o Plano Acordado não cobre a prioridade principal.';

notify pgrst, 'reload schema';
