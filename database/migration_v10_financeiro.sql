-- Fechamento comercial por empresa
create table if not exists public.financeiro_growth(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null unique references public.empresas on delete cascade,
 plano_implantacao_id uuid references public.planos_implantacao on delete set null,
 valor_implantacao numeric(12,2) default 0, valor_mensalidade numeric(12,2) default 0,
 desconto_pix numeric(5,2) default 10 check(desconto_pix between 0 and 100),
 link_pix text, link_cartao text, link_assinatura text,
 prazo_contratual integer default 12, status text default 'Links pendentes'
 check(status in ('Links pendentes','Proposta pronta','Aceite realizado','Pagamento aguardando confirmação','Pagamento confirmado','Kickoff liberado')),
 observacoes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists financeiro_growth_empresa_idx on public.financeiro_growth(empresa_id);
alter table public.financeiro_growth enable row level security;
do $$ begin create policy "equipe gerencia financeiro" on public.financeiro_growth for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;

insert into public.financeiro_growth(empresa_id,plano_implantacao_id,valor_implantacao,valor_mensalidade)
select p.empresa_id,p.id,
 case when coalesce(p.investimento->>'implantacao','') ~ '[0-9]' then replace(regexp_replace(p.investimento->>'implantacao','[^0-9,]','','g'),',','.')::numeric else 0 end,
 case when coalesce(p.investimento->>'mensalidade','') ~ '[0-9]' then replace(regexp_replace(p.investimento->>'mensalidade','[^0-9,]','','g'),',','.')::numeric else 0 end
from public.planos_implantacao p on conflict(empresa_id) do nothing;

