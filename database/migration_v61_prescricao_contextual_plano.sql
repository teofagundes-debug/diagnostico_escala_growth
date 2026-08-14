-- V61 - Prescrição contextual da Revisão Estratégica no Plano Executável
alter table public.strategic_execution_plans
  add column if not exists contextual_prescriptions jsonb not null default '[]'::jsonb,
  add column if not exists contextual_prescription_version text;

comment on column public.strategic_execution_plans.contextual_prescriptions is
  'Snapshot estruturado e imutável no contexto do DRAFT com as decisões da última Revisão Estratégica.';
comment on column public.strategic_execution_plans.contextual_prescription_version is
  'Versão da regra de prescrição contextual aplicada ao DRAFT. Não altera snapshots publicados anteriores.';

notify pgrst, 'reload schema';
