begin;

create table if not exists public.pendencias_inteligentes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  projeto_evolucao_id uuid not null references public.projetos_evolucao(id) on delete cascade,
  codigo text not null,
  titulo text not null,
  categoria text not null,
  status text not null default 'Pendente'
    check (status in ('Pendente','Concluída','Dispensada')),
  rota_configuracao text,
  solucoes_origem jsonb not null default '[]'::jsonb,
  dados_configuracao jsonb not null default '{}'::jsonb,
  criada_automaticamente boolean not null default true,
  concluida_em timestamptz,
  concluida_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (projeto_evolucao_id, codigo)
);

create index if not exists pendencias_inteligentes_empresa_idx
  on public.pendencias_inteligentes(empresa_id, status, created_at desc);
create index if not exists pendencias_inteligentes_projeto_idx
  on public.pendencias_inteligentes(projeto_evolucao_id, status);

alter table public.pendencias_inteligentes enable row level security;
drop policy if exists "Service role gerencia pendências inteligentes" on public.pendencias_inteligentes;
create policy "Service role gerencia pendências inteligentes"
  on public.pendencias_inteligentes for all to service_role using(true) with check(true);
drop policy if exists "Master consulta pendências inteligentes" on public.pendencias_inteligentes;
create policy "Master consulta pendências inteligentes"
  on public.pendencias_inteligentes for select to authenticated
  using(exists(select 1 from public.portal_usuarios pu where pu.auth_user_id=auth.uid() and pu.ativo and pu.perfil='master'));

comment on table public.pendencias_inteligentes is
  'Configurações internas geradas automaticamente pelo Motor de Crescimento e acompanhadas até a implantação.';

commit;
