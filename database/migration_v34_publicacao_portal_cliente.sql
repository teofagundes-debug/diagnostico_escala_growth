-- V34 - Publicação oficial do Portal do Cliente
-- Separa a configuração financeira da disponibilização da proposta.

alter table if exists public.financeiro_growth
  add column if not exists publicada_em timestamptz,
  add column if not exists publicada_por text,
  add column if not exists versao_publicada integer,
  add column if not exists snapshot_publicado jsonb;

create table if not exists public.proposta_publicacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  diagnostico_id uuid references public.diagnosticos(id) on delete set null,
  plano_estrategico_id uuid references public.planos_estrategicos(id) on delete set null,
  plano_implantacao_id uuid references public.planos_implantacao(id) on delete set null,
  versao integer not null,
  status text not null default 'PUBLICADA',
  snapshot jsonb not null,
  publicada_por text not null,
  publicada_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint proposta_publicacoes_empresa_versao_unique unique (empresa_id, versao)
);

create index if not exists proposta_publicacoes_empresa_idx
  on public.proposta_publicacoes(empresa_id, publicada_em desc);

alter table public.proposta_publicacoes enable row level security;

drop policy if exists "Service role gerencia publicações" on public.proposta_publicacoes;
create policy "Service role gerencia publicações"
on public.proposta_publicacoes for all to service_role
using (true) with check (true);

comment on table public.proposta_publicacoes is
  'Histórico imutável das versões de proposta oficialmente publicadas no Portal do Cliente.';
comment on column public.financeiro_growth.snapshot_publicado is
  'Última versão publicada utilizada pelo Portal, separada dos dados financeiros em edição.';

alter table if exists public.financeiro_growth
  drop constraint if exists financeiro_growth_status_check;

alter table if exists public.financeiro_growth
  add constraint financeiro_growth_status_check
  check (
    status is null or status in (
      'Links pendentes','Proposta pronta','Pagamento aguardando confirmação','Kickoff liberado',
      'Em elaboração','Plano aprovado','Financeiro configurado','Portal publicado',
      'Cliente acessou','Aceite realizado','Pagamento confirmado','Projeto iniciado'
    )
  );

notify pgrst, 'reload schema';
