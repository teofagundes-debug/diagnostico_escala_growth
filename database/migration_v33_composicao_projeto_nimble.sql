-- V33 - Composição estruturada do projeto e infraestrutura recorrente
-- Registra serviços vinculados automaticamente por dependência, sem misturá-los às aprovações estratégicas.

create table if not exists public.projeto_solucoes_vinculadas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade,
  reuniao_id uuid references public.reunioes_estrategicas(id) on delete cascade,
  plano_estrategico_id uuid references public.planos_estrategicos(id) on delete cascade,
  plano_implantacao_id uuid references public.planos_implantacao(id) on delete cascade,
  solucao_id uuid references public.catalogo_recursos(id) on delete restrict,
  solucao text not null,
  codigo text,
  tipo text not null,
  status text not null default 'Vinculada',
  origem text not null,
  motivo text,
  solucoes_relacionadas jsonb not null default '[]'::jsonb,
  inclusao_automatica boolean not null default false,
  contratado boolean not null default false,
  vinculado_em timestamptz not null default now(),
  removido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projeto_solucoes_vinculadas_tipo_check check (tipo in ('Implantação','Mensalidade','Avulso')),
  constraint projeto_solucoes_vinculadas_status_check check (status in ('Vinculada','Contratada','Removida')),
  constraint projeto_solucoes_vinculadas_unique unique (projeto_id, solucao_id)
);

create index if not exists projeto_solucoes_vinculadas_diagnostico_idx
  on public.projeto_solucoes_vinculadas(diagnostico_id, status);
create index if not exists projeto_solucoes_vinculadas_empresa_idx
  on public.projeto_solucoes_vinculadas(empresa_id, status);

alter table public.projeto_solucoes_vinculadas enable row level security;

drop policy if exists "Service role gerencia composição do projeto" on public.projeto_solucoes_vinculadas;
create policy "Service role gerencia composição do projeto"
on public.projeto_solucoes_vinculadas
for all
to service_role
using (true)
with check (true);

comment on table public.projeto_solucoes_vinculadas is
  'Composição comercial estruturada do projeto, incluindo infraestrutura recorrente automática.';
comment on column public.projeto_solucoes_vinculadas.solucoes_relacionadas is
  'Soluções que provocaram a inclusão automática por dependência.';
