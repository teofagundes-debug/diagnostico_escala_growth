-- V69 — Fase 2A: vínculo canônico e snapshot comercial da Implantação de Ferramentas.
create table if not exists public.implantacao_ferramentas_mapeamentos (
 id uuid primary key default gen_random_uuid(),
 solution_type text not null,
 recurso_id uuid not null references public.catalogo_recursos(id) on delete restrict,
 condition_type text not null default 'ALWAYS' check(condition_type in ('ALWAYS','CHANNEL')),
 condition_value text not null default '',
 quantidade_padrao numeric(10,2) not null default 1 check(quantidade_padrao > 0),
 unidade_comercial text not null default 'unidade',
 ativo boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(solution_type,recurso_id,condition_type,condition_value)
);

alter table public.pre_propostas_implantacao
 add column if not exists itens_comerciais jsonb not null default '[]'::jsonb,
 add column if not exists snapshot_comercial jsonb;

insert into public.implantacao_ferramentas_mapeamentos(solution_type,recurso_id,unidade_comercial)
select 'CRM',id,'unidade' from public.catalogo_recursos where codigo='CRM-001'
on conflict do nothing;
insert into public.implantacao_ferramentas_mapeamentos(solution_type,recurso_id,unidade_comercial)
select 'AI_AGENT',id,'agente' from public.catalogo_recursos where codigo='IA-001'
on conflict do nothing;
insert into public.implantacao_ferramentas_mapeamentos(solution_type,recurso_id,unidade_comercial)
select 'SERVICE_AUTOMATION',id,'automação' from public.catalogo_recursos where codigo='AUT-001'
on conflict do nothing;
insert into public.implantacao_ferramentas_mapeamentos(solution_type,recurso_id,condition_type,condition_value,unidade_comercial)
select source.solution_type,catalog.id,'CHANNEL','WhatsApp','canal'
from (values ('AI_AGENT'),('SERVICE_AUTOMATION')) source(solution_type)
join public.catalogo_recursos catalog on catalog.codigo='WPP-001'
on conflict do nothing;

alter table public.implantacao_ferramentas_mapeamentos enable row level security;
drop policy if exists "Service role gerencia mapeamentos de ferramentas" on public.implantacao_ferramentas_mapeamentos;
create policy "Service role gerencia mapeamentos de ferramentas" on public.implantacao_ferramentas_mapeamentos for all to service_role using(true) with check(true);
revoke all on public.implantacao_ferramentas_mapeamentos from anon,authenticated;
notify pgrst, 'reload schema';
