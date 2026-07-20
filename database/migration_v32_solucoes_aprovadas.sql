-- V32 - Soluções de Implantação aprovadas na Reunião Estratégica
-- Fonte oficial para Plano Estratégico, Plano de Implantação, Cronograma e acompanhamento.

create table if not exists public.projeto_solucoes_aprovadas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade,
  reuniao_id uuid references public.reunioes_estrategicas(id) on delete cascade,
  plano_estrategico_id uuid references public.planos_estrategicos(id) on delete cascade,
  plano_implantacao_id uuid references public.planos_implantacao(id) on delete cascade,
  solucao_id uuid references public.catalogo_recursos(id) on delete restrict,
  solucao text not null,
  solucao_chave text not null,
  tipo text not null default 'Implantação',
  status text not null default 'Aprovada',
  origem text not null default 'Reunião Estratégica',
  aprovada_por text,
  aprovada_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projeto_solucoes_tipo_check check (tipo = 'Implantação'),
  constraint projeto_solucoes_status_check check (status in ('Aprovada','Revogada')),
  constraint projeto_solucoes_reuniao_solucao_unique unique (reuniao_id, solucao_chave)
);

create index if not exists projeto_solucoes_projeto_idx
  on public.projeto_solucoes_aprovadas(projeto_id, status);
create index if not exists projeto_solucoes_diagnostico_idx
  on public.projeto_solucoes_aprovadas(diagnostico_id, status);
create index if not exists projeto_solucoes_empresa_idx
  on public.projeto_solucoes_aprovadas(empresa_id, status);

alter table public.projeto_solucoes_aprovadas enable row level security;

drop policy if exists "Service role gerencia soluções aprovadas" on public.projeto_solucoes_aprovadas;
create policy "Service role gerencia soluções aprovadas"
on public.projeto_solucoes_aprovadas
for all
to service_role
using (true)
with check (true);

comment on table public.projeto_solucoes_aprovadas is
  'Fonte oficial das soluções de Implantação aprovadas na Reunião Estratégica.';
comment on column public.projeto_solucoes_aprovadas.projeto_id is
  'Identificador do projeto: Plano de Implantação quando existente; caso contrário, Plano Estratégico.';
comment on column public.projeto_solucoes_aprovadas.aprovada_em is
  'Data e hora em que a solução foi confirmada durante a Reunião Estratégica.';
