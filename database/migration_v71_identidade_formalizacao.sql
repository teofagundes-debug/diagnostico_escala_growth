-- V71 — Identidade compartilhada e aditiva de formalização.
-- Não publica Implantação de Ferramentas e não reescreve snapshots/documentos.

create table if not exists public.formalizacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  origem text not null check (origem in ('ESCALA_GROWTH','IMPLANTACAO_FERRAMENTAS')),
  origem_id uuid not null,
  versao integer not null default 1 check (versao > 0),
  status text not null default 'EM_PREPARACAO' check (status in (
    'EM_PREPARACAO','PRONTA','PUBLICADA','ACEITA','PAGAMENTO_PENDENTE','FORMALIZADA','ARQUIVADA'
  )),
  created_by text,
  published_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint formalizacoes_origem_versao_unique unique (origem,origem_id,versao),
  constraint formalizacoes_id_empresa_unique unique (id,empresa_id)
);

create index if not exists formalizacoes_empresa_idx
  on public.formalizacoes(empresa_id,created_at desc);
create index if not exists formalizacoes_origem_idx
  on public.formalizacoes(origem,origem_id,versao desc);

alter table public.proposta_publicacoes add column if not exists formalizacao_id uuid;
alter table public.financeiro_growth add column if not exists formalizacao_id uuid;
alter table public.contratos_growth add column if not exists formalizacao_id uuid;
alter table public.aceites_growth add column if not exists formalizacao_id uuid;
alter table public.pagamentos_growth add column if not exists formalizacao_id uuid;

-- Uma formalização Growth é inequívoca quando existe um Projeto de Evolução explícito.
insert into public.formalizacoes(empresa_id,origem,origem_id,versao,status,published_at)
select distinct pe.empresa_id,'ESCALA_GROWTH',pe.id,1,
 case when pe.status='Formalizado' then 'FORMALIZADA'
      when pe.status='Aceito' then 'ACEITA'
      when pe.status='Publicado' then 'PUBLICADA'
      else 'EM_PREPARACAO' end,
 pe.publicado_em
from public.projetos_evolucao pe
where exists (
 select 1 from public.proposta_publicacoes pp where pp.projeto_evolucao_id=pe.id
 union all select 1 from public.contratos_growth c where c.projeto_evolucao_id=pe.id
 union all select 1 from public.aceites_growth a where a.projeto_evolucao_id=pe.id
 union all select 1 from public.pagamentos_growth pg where pg.projeto_evolucao_id=pe.id
)
on conflict (origem,origem_id,versao) do nothing;

update public.proposta_publicacoes row
set formalizacao_id=f.id
from public.formalizacoes f
where row.formalizacao_id is null and row.projeto_evolucao_id=f.origem_id
  and row.empresa_id=f.empresa_id and f.origem='ESCALA_GROWTH';
update public.contratos_growth row
set formalizacao_id=f.id
from public.formalizacoes f
where row.formalizacao_id is null and row.projeto_evolucao_id=f.origem_id
  and row.empresa_id=f.empresa_id and f.origem='ESCALA_GROWTH';
update public.aceites_growth row
set formalizacao_id=f.id
from public.formalizacoes f
where row.formalizacao_id is null and row.projeto_evolucao_id=f.origem_id
  and row.empresa_id=f.empresa_id and f.origem='ESCALA_GROWTH';
update public.pagamentos_growth row
set formalizacao_id=f.id
from public.formalizacoes f
where row.formalizacao_id is null and row.projeto_evolucao_id=f.origem_id
  and row.empresa_id=f.empresa_id and f.origem='ESCALA_GROWTH';

-- Financeiro não possui projeto_evolucao_id. Só é associado quando o snapshot aponta
-- explicitamente para o projeto ou há exatamente uma formalização Growth candidata.
update public.financeiro_growth row
set formalizacao_id=f.id
from public.formalizacoes f
where row.formalizacao_id is null and f.empresa_id=row.empresa_id
  and f.origem='ESCALA_GROWTH'
  and coalesce(row.snapshot_publicado->'project'->>'id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (row.snapshot_publicado->'project'->>'id')::uuid=f.origem_id;

with unique_candidate as (
 select empresa_id,min(id::text)::uuid formalizacao_id
 from public.formalizacoes where origem='ESCALA_GROWTH'
 group by empresa_id having count(*)=1
)
update public.financeiro_growth row
set formalizacao_id=c.formalizacao_id
from unique_candidate c
where row.formalizacao_id is null and row.empresa_id=c.empresa_id;

do $$ begin
 alter table public.proposta_publicacoes add constraint proposta_publicacoes_formalizacao_empresa_fk
 foreign key(formalizacao_id,empresa_id) references public.formalizacoes(id,empresa_id) on delete restrict;
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.financeiro_growth add constraint financeiro_growth_formalizacao_empresa_fk
 foreign key(formalizacao_id,empresa_id) references public.formalizacoes(id,empresa_id) on delete restrict;
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.contratos_growth add constraint contratos_growth_formalizacao_empresa_fk
 foreign key(formalizacao_id,empresa_id) references public.formalizacoes(id,empresa_id) on delete restrict;
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.aceites_growth add constraint aceites_growth_formalizacao_empresa_fk
 foreign key(formalizacao_id,empresa_id) references public.formalizacoes(id,empresa_id) on delete restrict;
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.pagamentos_growth add constraint pagamentos_growth_formalizacao_empresa_fk
 foreign key(formalizacao_id,empresa_id) references public.formalizacoes(id,empresa_id) on delete restrict;
exception when duplicate_object then null; end $$;

-- A remoção da unicidade por empresa fica para o cutover que substituirá todos os
-- upserts legados `on_conflict=empresa_id`. Mantê-la nesta migration evita quebrar
-- imediatamente as gravações Growth enquanto nenhum fluxo novo usa o financeiro.
create unique index if not exists financeiro_growth_formalizacao_unique
 on public.financeiro_growth(formalizacao_id) where formalizacao_id is not null;

create index if not exists proposta_publicacoes_formalizacao_idx on public.proposta_publicacoes(formalizacao_id,versao desc);
create index if not exists contratos_growth_formalizacao_idx on public.contratos_growth(formalizacao_id,created_at desc);
create index if not exists aceites_growth_formalizacao_idx on public.aceites_growth(formalizacao_id,aceito_em desc);
create index if not exists pagamentos_growth_formalizacao_idx on public.pagamentos_growth(formalizacao_id,created_at desc);

alter table public.formalizacoes enable row level security;
drop policy if exists "Service role gerencia formalizacoes" on public.formalizacoes;
create policy "Service role gerencia formalizacoes" on public.formalizacoes
 for all to service_role using(true) with check(true);
drop policy if exists "Portal consulta formalizacoes da empresa" on public.formalizacoes;
create policy "Portal consulta formalizacoes da empresa" on public.formalizacoes
 for select to authenticated using(exists(
   select 1 from public.portal_usuarios pu
   where pu.auth_user_id=auth.uid() and pu.ativo=true and pu.empresa_id=formalizacoes.empresa_id
 ));

-- Inventário seguro: linhas restantes são ambíguas e ficam NULL para o fallback histórico.
create or replace view public.formalizacoes_backfill_pendencias as
 select 'proposta_publicacoes'::text tabela,id,empresa_id from public.proposta_publicacoes where formalizacao_id is null
 union all select 'financeiro_growth',id,empresa_id from public.financeiro_growth where formalizacao_id is null
 union all select 'contratos_growth',id,empresa_id from public.contratos_growth where formalizacao_id is null
 union all select 'aceites_growth',id,empresa_id from public.aceites_growth where formalizacao_id is null
 union all select 'pagamentos_growth',id,empresa_id from public.pagamentos_growth where formalizacao_id is null;

comment on table public.formalizacoes is 'Identidade de uma contratação/formalização específica, compartilhada entre origens comerciais.';
comment on view public.formalizacoes_backfill_pendencias is 'Registros históricos cuja formalização não pôde ser determinada sem aproximação.';
revoke all on public.formalizacoes_backfill_pendencias from anon,authenticated;
grant select on public.formalizacoes_backfill_pendencias to service_role;
notify pgrst, 'reload schema';
