begin;

alter table public.projeto_evolucao_recursos
  add column if not exists recomendado_metodo boolean not null default false,
  add column if not exists contratado boolean not null default false,
  add column if not exists executor text,
  add column if not exists executor_dados jsonb not null default '{}'::jsonb,
  add column if not exists decisao_em timestamptz,
  add column if not exists decisao_por text;

alter table public.projeto_evolucao_recursos
  drop constraint if exists projeto_evolucao_recursos_executor_check;
alter table public.projeto_evolucao_recursos
  add constraint projeto_evolucao_recursos_executor_check check (
    executor is null or executor in (
      'Escala Vendas',
      'Parceiro do Cliente',
      'Equipe Interna do Cliente',
      'Não executar neste momento'
    )
  );

update public.projeto_evolucao_recursos
set recomendado_metodo = true
where classificacao in ('Recomendado','Opcional')
   or origem ilike '%Motor%'
   or fase in ('Recomendações Estratégicas','Evoluções Futuras');

create table if not exists public.estrategia_execucao_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  projeto_evolucao_id uuid not null references public.projetos_evolucao(id) on delete cascade,
  recurso_id uuid references public.catalogo_recursos(id) on delete set null,
  nome_snapshot text not null,
  executor_anterior text,
  executor_novo text,
  dados_anteriores jsonb not null default '{}'::jsonb,
  dados_novos jsonb not null default '{}'::jsonb,
  alterado_por text not null default 'Usuário Master',
  motivo text,
  created_at timestamptz not null default now()
);

create index if not exists estrategia_execucao_empresa_idx
  on public.estrategia_execucao_historico(empresa_id, created_at desc);
create index if not exists estrategia_execucao_projeto_idx
  on public.estrategia_execucao_historico(projeto_evolucao_id, created_at desc);

alter table public.estrategia_execucao_historico enable row level security;
drop policy if exists "Service role gerencia histórico de execução" on public.estrategia_execucao_historico;
create policy "Service role gerencia histórico de execução"
  on public.estrategia_execucao_historico for all to service_role using(true) with check(true);
drop policy if exists "Master consulta histórico de execução" on public.estrategia_execucao_historico;
create policy "Master consulta histórico de execução"
  on public.estrategia_execucao_historico for select to authenticated
  using(exists(select 1 from public.portal_usuarios pu where pu.auth_user_id=auth.uid() and pu.ativo and pu.perfil='master'));

comment on column public.projeto_evolucao_recursos.recomendado_metodo is
  'Preserva a recomendação original do Método, independentemente de contratação ou executor.';
comment on column public.projeto_evolucao_recursos.contratado is
  'Indica contratação da solução com a Escala Vendas; não altera a recomendação metodológica.';
comment on table public.estrategia_execucao_historico is
  'Histórico imutável das decisões de execução por solução recomendada.';

commit;
