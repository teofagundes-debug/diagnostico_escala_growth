-- Parametros de marketing e separacao entre receita e investimento em midia.
create table if not exists public.marketing_parametros(
 id uuid primary key default gen_random_uuid(), plataforma text unique not null, codigo text unique not null,
 ui numeric(8,2) not null default 5, valor_gestao_mensal numeric(12,2) not null default 0,
 responsavel_padrao text not null default 'Cliente' check(responsavel_padrao in ('Escala Vendas','Cliente','Parceiro')),
 investimentos jsonb not null default '{"local":0,"regional":0,"nacional":0,"personalizado":0}'::jsonb,
 ativo boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
insert into public.marketing_parametros(plataforma,codigo,ui) values
 ('Google Ads','MKT-GOOGLE',5),('Meta Ads','MKT-META',5)
on conflict(plataforma) do nothing;

update public.catalogo_recursos set ui=5,updated_at=now() where nome in ('Google Ads','Meta Ads');

alter table public.financeiro_growth add column if not exists marketing_cenario text default 'local';
alter table public.financeiro_growth add column if not exists google_responsavel text;
alter table public.financeiro_growth add column if not exists meta_responsavel text;
alter table public.financeiro_growth add column if not exists google_investimento numeric(12,2);
alter table public.financeiro_growth add column if not exists meta_investimento numeric(12,2);
alter table public.financeiro_growth add column if not exists google_gestao numeric(12,2);
alter table public.financeiro_growth add column if not exists meta_gestao numeric(12,2);
alter table public.financeiro_growth add column if not exists servicos_adicionais numeric(12,2) default 0;

alter table public.marketing_parametros enable row level security;
do $$ begin create policy "master gerencia parametros marketing" on public.marketing_parametros for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;

comment on table public.marketing_parametros is 'Estrutura extensivel para novas plataformas sem misturar investimento em midia com faturamento da Escala Vendas.';
