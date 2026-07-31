begin;

create table if not exists public.projetos_evolucao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('Adesão ao Método','Novo recurso','Expansão','Upgrade','Substituição','Ajuste contratual','Renovação','Outro')),
  descricao text,
  objetivo text,
  status text not null default 'Em elaboração' check (status in ('Em elaboração','Em análise','Aguardando aprovação','Aprovado','Publicado','Aceito','Aguardando pagamento','Pagamento confirmado','Formalizado sem novo pagamento','Ativo','Concluído','Cancelado','Arquivado')),
  valor_implantacao_adicional numeric(12,2) not null default 0 check (valor_implantacao_adicional >= 0),
  implantacao_modalidade text not null default 'Sem cobrança' check (implantacao_modalidade in ('Cobrança normal','Sem cobrança','Isenta','Já realizada')),
  mensalidade_atual numeric(12,2) not null default 0,
  mensalidade_adicional numeric(12,2) not null default 0,
  desconto_recorrente numeric(12,2) not null default 0,
  nova_mensalidade numeric(12,2) generated always as (greatest(0, mensalidade_atual + mensalidade_adicional - desconto_recorrente)) stored,
  data_inicio date,
  observacoes_internas text,
  exige_contrato boolean not null default false,
  exige_aditivo boolean not null default false,
  exige_aceite boolean not null default true,
  exige_pagamento boolean not null default false,
  forma_cobranca text not null default 'Sem pagamento imediato' check (forma_cobranca in ('PIX','Cartão','Assinatura','Transferência','Recorrência existente','Sem pagamento imediato')),
  formalizacao text not null default 'Aceite eletrônico' check (formalizacao in ('Novo contrato','Aditivo contratual','Aceite eletrônico','Sem novo documento')),
  criado_por text,
  aprovado_em timestamptz,
  publicado_em timestamptz,
  aceito_em timestamptz,
  formalizado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projeto_evolucao_recursos (
  id uuid primary key default gen_random_uuid(),
  projeto_evolucao_id uuid not null references public.projetos_evolucao(id) on delete cascade,
  recurso_id uuid references public.catalogo_recursos(id) on delete restrict,
  nome_snapshot text not null,
  tipo_snapshot text not null,
  movimento text not null check (movimento in ('Adicionar','Remover','Manter')),
  valor_implantacao numeric(12,2) not null default 0,
  valor_mensal numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (projeto_evolucao_id, recurso_id, movimento)
);

create table if not exists public.situacoes_comerciais_versoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  projeto_evolucao_id uuid references public.projetos_evolucao(id) on delete set null,
  versao integer not null,
  vigente boolean not null default true,
  mensalidade numeric(12,2) not null default 0,
  forma_pagamento text,
  status_pagamento text,
  contrato_status text,
  contrato_inicio date,
  prazo_meses integer not null default 12 check (prazo_meses = 12),
  renovacao_em date,
  recursos jsonb not null default '[]'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (empresa_id, versao)
);

create unique index if not exists situacao_comercial_vigente_empresa_idx on public.situacoes_comerciais_versoes(empresa_id) where vigente;
create index if not exists projetos_evolucao_empresa_idx on public.projetos_evolucao(empresa_id, created_at desc);
create index if not exists projeto_evolucao_recursos_projeto_idx on public.projeto_evolucao_recursos(projeto_evolucao_id);

alter table public.contratos_growth add column if not exists projeto_evolucao_id uuid references public.projetos_evolucao(id) on delete set null;
alter table public.aceites_growth add column if not exists projeto_evolucao_id uuid references public.projetos_evolucao(id) on delete set null;
alter table public.pagamentos_growth add column if not exists projeto_evolucao_id uuid references public.projetos_evolucao(id) on delete set null;
alter table public.proposta_publicacoes add column if not exists projeto_evolucao_id uuid references public.projetos_evolucao(id) on delete set null;

alter table public.projetos_evolucao enable row level security;
alter table public.projeto_evolucao_recursos enable row level security;
alter table public.situacoes_comerciais_versoes enable row level security;
drop policy if exists "Service role gerencia projetos de evolução" on public.projetos_evolucao;
create policy "Service role gerencia projetos de evolução" on public.projetos_evolucao for all to service_role using (true) with check (true);
drop policy if exists "Service role gerencia recursos de evolução" on public.projeto_evolucao_recursos;
create policy "Service role gerencia recursos de evolução" on public.projeto_evolucao_recursos for all to service_role using (true) with check (true);
drop policy if exists "Service role gerencia histórico comercial" on public.situacoes_comerciais_versoes;
create policy "Service role gerencia histórico comercial" on public.situacoes_comerciais_versoes for all to service_role using (true) with check (true);

comment on table public.projetos_evolucao is 'Projetos comerciais incrementais; nunca substituem o histórico contratual da empresa.';
comment on table public.situacoes_comerciais_versoes is 'Snapshots imutáveis da situação comercial efetivamente formalizada.';
commit;
