-- Migração v18 — arquitetura definitiva dos parâmetros comerciais
alter table public.parametros_comerciais
  add column if not exists reajuste_indice text not null default 'IPCA',
  add column if not exists reajuste_periodicidade integer not null default 12,
  add column if not exists reajuste_mes_base integer not null default 1,
  add column if not exists multa_atraso numeric(5,2),
  add column if not exists juros_atraso numeric(5,2),
  add column if not exists dias_tolerancia integer;

alter table public.parametros_comerciais drop constraint if exists parametros_comerciais_reajuste_indice_check;
alter table public.parametros_comerciais add constraint parametros_comerciais_reajuste_indice_check check (reajuste_indice in ('IPCA','IGP-M'));
alter table public.parametros_comerciais drop constraint if exists parametros_comerciais_reajuste_periodicidade_check;
alter table public.parametros_comerciais add constraint parametros_comerciais_reajuste_periodicidade_check check (reajuste_periodicidade > 0);
alter table public.parametros_comerciais drop constraint if exists parametros_comerciais_reajuste_mes_base_check;
alter table public.parametros_comerciais add constraint parametros_comerciais_reajuste_mes_base_check check (reajuste_mes_base between 1 and 12);

alter table public.catalogo_recursos
  alter column ui drop not null,
  alter column ui drop default,
  add column if not exists valor_mensal numeric(12,2),
  add column if not exists valor_avulso numeric(12,2),
  add column if not exists obrigatoriedade text not null default 'Padrão';

update public.catalogo_recursos set tipo='Implantação' where tipo is null or tipo not in ('Implantação','Mensalidade','Avulso');
update public.catalogo_recursos set ui=coalesce(ui,1) where tipo='Implantação';
update public.catalogo_recursos set ui=null,valor_mensal=coalesce(valor_mensal,0),valor_avulso=null where tipo='Mensalidade';
update public.catalogo_recursos set ui=null,valor_avulso=coalesce(valor_avulso,0),valor_mensal=null where tipo='Avulso';

alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_tipo_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_tipo_check check (tipo in ('Implantação','Mensalidade','Avulso'));
alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_obrigatoriedade_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_obrigatoriedade_check check (obrigatoriedade in ('Obrigatório','Padrão','Sob Demanda'));
alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_valores_por_tipo_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_valores_por_tipo_check check (
  (tipo='Implantação' and ui is not null and ui > 0 and valor_mensal is null and valor_avulso is null)
  or (tipo='Mensalidade' and ui is null and valor_mensal is not null and valor_mensal >= 0 and valor_avulso is null)
  or (tipo='Avulso' and ui is null and valor_avulso is not null and valor_avulso >= 0 and valor_mensal is null)
);

create table if not exists public.commercial_audit_log(
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  entidade_id uuid,
  acao text not null,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.commercial_audit_log enable row level security;
do $$ begin
  create policy "master consulta log comercial" on public.commercial_audit_log for select to authenticated using(true);
exception when duplicate_object then null; end $$;

comment on table public.commercial_audit_log is 'Registro administrativo imutável das alterações nos parâmetros e serviços comerciais.';

