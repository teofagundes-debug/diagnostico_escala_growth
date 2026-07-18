-- V21 - Preparação e condução da Reunião Estratégica
create table if not exists public.preparacoes_reuniao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade,
  reuniao_id uuid references public.reunioes_estrategicas(id) on delete set null,
  hipotese_inicial text,
  recomendacoes jsonb not null default '[]'::jsonb,
  prontidao jsonb not null default '{}'::jsonb,
  pontos_validacao jsonb not null default '{}'::jsonb,
  perguntas_especificas text,
  validacoes_reuniao jsonb not null default '{}'::jsonb,
  parecer_reuniao text,
  status text not null default 'Em preparação',
  iniciada_em timestamptz,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(diagnostico_id)
);

create index if not exists preparacoes_reuniao_empresa_idx
  on public.preparacoes_reuniao(empresa_id, updated_at desc);

alter table public.preparacoes_reuniao enable row level security;

drop policy if exists "master gerencia preparacoes" on public.preparacoes_reuniao;
create policy "master gerencia preparacoes"
  on public.preparacoes_reuniao for all to authenticated
  using (true) with check (true);

comment on table public.preparacoes_reuniao is
  'Material interno de preparação, condução e validação da Reunião Estratégica; nunca exposto ao cliente.';

