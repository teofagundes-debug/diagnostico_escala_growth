-- V53 - Plano Estratégico Executável 1.0 (paralelo ao Plano Estratégico legado)
create table if not exists public.strategic_execution_plans (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
 diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade, version_number integer not null default 1,
 status text not null default 'DRAFT' check(status in ('DRAFT','PUBLISHED','SUPERSEDED')),
 strategic_direction text, primary_priority text, acquisition_movement text,
 action_plan_source_version text not null default '1.0', feature_version text not null default '1.0',
 general_consultant_notes text, consultant text, published_at timestamptz, published_by text,
 published_snapshot jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(diagnostico_id,version_number)
);
create table if not exists public.strategic_execution_plan_actions (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.strategic_execution_plans(id) on delete cascade,
 source_type text not null check(source_type in ('ENGINE','CONSULTANT')), source_action_code text,
 recommended_snapshot jsonb, agreed_title text not null, agreed_objective text, agreed_indicator text, agreed_target text,
 responsible text, due_date date, agreed_horizon text not null check(agreed_horizon in ('AGORA','DEPOIS','QUANDO_ESTIVER_PRONTO')),
 status text not null default 'PLANNED' check(status in ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')),
 consultant_notes text, strategic_change_reason text, start_condition text, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(plan_id,source_action_code), check(source_type='ENGINE' or source_action_code is null)
);
create table if not exists public.strategic_execution_plan_history (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.strategic_execution_plans(id) on delete cascade,
 action_id uuid references public.strategic_execution_plan_actions(id) on delete set null,
 event_type text not null, description text not null, actor text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists strategic_execution_plans_diagnostic_idx on public.strategic_execution_plans(diagnostico_id,version_number desc);
create index if not exists strategic_execution_actions_plan_idx on public.strategic_execution_plan_actions(plan_id,agreed_horizon);
create index if not exists strategic_execution_history_plan_idx on public.strategic_execution_plan_history(plan_id,created_at desc);
alter table public.strategic_execution_plans enable row level security;
alter table public.strategic_execution_plan_actions enable row level security;
alter table public.strategic_execution_plan_history enable row level security;
drop policy if exists "Service role gerencia planos executáveis" on public.strategic_execution_plans;
create policy "Service role gerencia planos executáveis" on public.strategic_execution_plans for all to service_role using(true) with check(true);
drop policy if exists "Service role gerencia ações executáveis" on public.strategic_execution_plan_actions;
create policy "Service role gerencia ações executáveis" on public.strategic_execution_plan_actions for all to service_role using(true) with check(true);
drop policy if exists "Service role gerencia histórico executável" on public.strategic_execution_plan_history;
create policy "Service role gerencia histórico executável" on public.strategic_execution_plan_history for all to service_role using(true) with check(true);
comment on table public.strategic_execution_plans is 'Plano Estratégico Executável 1.0, isolado do documento legado e do Portal atual.';
