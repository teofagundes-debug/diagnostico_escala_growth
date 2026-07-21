-- Fechamento da Fase 1: contrato, não renovação e operação do cliente.

alter table public.configuracoes
  add column if not exists razao_social text,
  add column if not exists nome_fantasia text,
  add column if not exists cnpj text,
  add column if not exists endereco text,
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists cep text,
  add column if not exists financeiro_email text;

alter table public.empresas
  add column if not exists razao_social text,
  add column if not exists nome_fantasia text,
  add column if not exists cpf_cnpj text,
  add column if not exists endereco text,
  add column if not exists cep text;

alter table public.pagamentos_growth
  add column if not exists confirmado_por text;

create table if not exists public.solicitacoes_nao_renovacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  contrato_id uuid references public.contratos_growth(id) on delete set null,
  usuario_id uuid references public.portal_usuarios(id) on delete set null,
  ciclo_inicio date not null,
  ciclo_fim date not null,
  protocolo text not null unique,
  status text not null default 'Não Renovar ao Final do Ciclo',
  solicitado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists solicitacoes_nao_renovacao_empresa_idx
  on public.solicitacoes_nao_renovacao(empresa_id, solicitado_em desc);

alter table public.solicitacoes_nao_renovacao enable row level security;

do $$ begin
  create policy "equipe gerencia não renovação"
  on public.solicitacoes_nao_renovacao for all to authenticated
  using (true) with check (true);
exception when duplicate_object then null;
end $$;

alter table public.financeiro_growth
  drop constraint if exists financeiro_growth_status_check;

alter table public.financeiro_growth
  add constraint financeiro_growth_status_check check (
    status is null or status in (
      'Links pendentes','Proposta pronta','Pagamento aguardando confirmação','Kickoff liberado',
      'Em elaboração','Plano aprovado','Financeiro configurado','Portal publicado',
      'Cliente acessou','Aceite realizado','Pagamento confirmado','Kickoff realizado',
      'Implantação em andamento','Cliente Ativo','Projeto iniciado'
    )
  );

notify pgrst, 'reload schema';
