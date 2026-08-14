-- V62 - Identidade canônica e proteção das ações contextuais futuras
-- Registros históricos permanecem intactos: nenhuma linha existente é atualizada.
alter table public.strategic_execution_plan_actions
  add column if not exists action_origin text,
  add column if not exists contextual_action_key text;

alter table public.strategic_execution_plan_actions
  drop constraint if exists strategic_execution_plan_actions_origin_check,
  add constraint strategic_execution_plan_actions_origin_check
    check (action_origin is null or action_origin in ('ENGINE','MANUAL','CONTEXTUAL')),
  drop constraint if exists strategic_execution_plan_actions_contextual_key_check,
  add constraint strategic_execution_plan_actions_contextual_key_check
    check (action_origin is distinct from 'CONTEXTUAL' or contextual_action_key is not null);

create unique index if not exists strategic_execution_actions_contextual_unique
  on public.strategic_execution_plan_actions(plan_id,contextual_action_key)
  where action_origin='CONTEXTUAL' and contextual_action_key is not null;

comment on column public.strategic_execution_plan_actions.action_origin is
  'Distingue ação do Motor, manual independente e decisão contextual da Revisão Estratégica.';
comment on column public.strategic_execution_plan_actions.contextual_action_key is
  'Identidade estável da decisão contextual; nula para ações históricas, manuais e do Motor.';

notify pgrst, 'reload schema';
