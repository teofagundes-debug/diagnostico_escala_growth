-- V35 - Histórico de versões do Plano Estratégico
-- Criação idempotente para bases que não executaram a migração inicial da Sprint.

create table if not exists public.plano_estrategico_versoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos_estrategicos(id) on delete cascade,
  diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade,
  versao integer not null,
  consultor text not null,
  conteudo jsonb not null default '{}'::jsonb,
  status text not null default 'Em Consolidação',
  created_at timestamptz not null default now(),
  constraint plano_estrategico_versoes_diagnostico_versao_unique unique (diagnostico_id, versao)
);

create index if not exists plano_estrategico_versoes_plano_idx
  on public.plano_estrategico_versoes(plano_id, versao desc);

alter table public.plano_estrategico_versoes enable row level security;

drop policy if exists "Service role gerencia versões do plano" on public.plano_estrategico_versoes;
create policy "Service role gerencia versões do plano"
on public.plano_estrategico_versoes
for all
to service_role
using (true)
with check (true);

drop policy if exists "Usuário autenticado consulta versões do plano" on public.plano_estrategico_versoes;
create policy "Usuário autenticado consulta versões do plano"
on public.plano_estrategico_versoes
for select
to authenticated
using (true);

comment on table public.plano_estrategico_versoes is
  'Histórico imutável das versões salvas do Plano Estratégico Escala Growth.';
