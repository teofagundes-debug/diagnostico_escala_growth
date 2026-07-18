-- V22 - Auditoria permanente de exclusões definitivas de empresas
create table if not exists public.exclusoes_empresas_log (
  id uuid primary key default gen_random_uuid(),
  empresa_id_excluida uuid not null,
  empresa_nome text not null,
  usuario_id uuid,
  usuario_email text not null,
  registros_removidos jsonb not null default '{}'::jsonb,
  arquivos_removidos integer not null default 0,
  usuarios_auth_removidos integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.exclusoes_empresas_log enable row level security;

drop policy if exists "master consulta exclusoes empresas" on public.exclusoes_empresas_log;
create policy "master consulta exclusoes empresas"
  on public.exclusoes_empresas_log for select to authenticated
  using (true);

comment on table public.exclusoes_empresas_log is
  'Auditoria imutável das exclusões definitivas de empresas executadas por Usuários Master.';

