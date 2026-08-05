begin;

alter table public.plano_estrategico_versoes
  add column if not exists motivo text,
  add column if not exists metodo_versao text,
  add column if not exists comparacao jsonb not null default '{}'::jsonb;

create table if not exists public.regeneracoes_metodo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  diagnostico_id uuid references public.diagnosticos(id) on delete set null,
  plano_id uuid references public.planos_estrategicos(id) on delete set null,
  tipo text not null,
  versao integer not null,
  metodo_versao text not null,
  motivo text not null,
  usuario text not null,
  opcoes jsonb not null default '{}'::jsonb,
  versao_anterior jsonb not null default '{}'::jsonb,
  versao_nova jsonb not null default '{}'::jsonb,
  comparacao jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(empresa_id,tipo,versao)
);

create index if not exists regeneracoes_metodo_empresa_idx on public.regeneracoes_metodo(empresa_id,created_at desc);
alter table public.regeneracoes_metodo enable row level security;
drop policy if exists "Service role gerencia regenerações" on public.regeneracoes_metodo;
create policy "Service role gerencia regenerações" on public.regeneracoes_metodo for all to service_role using(true) with check(true);
drop policy if exists "Master consulta regenerações" on public.regeneracoes_metodo;
create policy "Master consulta regenerações" on public.regeneracoes_metodo for select to authenticated
using(exists(select 1 from public.portal_usuarios pu where pu.auth_user_id=auth.uid() and pu.ativo and pu.perfil='master'));

commit;
