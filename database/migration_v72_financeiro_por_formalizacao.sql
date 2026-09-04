-- V72 — Corte financeiro por formalização após migração dos consumidores.
-- Os dois pagamentos históricos ambíguos permanecem intencionalmente sem formalizacao_id.

alter table public.financeiro_growth
 drop constraint if exists financeiro_growth_empresa_id_key;

drop index if exists public.financeiro_growth_formalizacao_unique;
create unique index financeiro_growth_formalizacao_unique
 on public.financeiro_growth(formalizacao_id)
 where formalizacao_id is not null;

drop index if exists public.financeiro_growth_legado_empresa_unique;
create index if not exists financeiro_growth_legado_empresa_idx
 on public.financeiro_growth(empresa_id)
 where formalizacao_id is null;

comment on index public.financeiro_growth_formalizacao_unique is
 'Uma configuração financeira por formalização moderna.';
comment on index public.financeiro_growth_legado_empresa_idx is
 'Acelera o fallback histórico sem impor unicidade a registros legados sem identidade.';

-- Garante propriedade coerente também em inserts/updates realizados fora das APIs.
create or replace function public.validar_financeiro_formalizacao_empresa()
returns trigger language plpgsql set search_path=public as $$
begin
 if new.formalizacao_id is not null and not exists(
  select 1 from public.formalizacoes f where f.id=new.formalizacao_id and f.empresa_id=new.empresa_id
 ) then raise exception 'A formalização não pertence à empresa informada.' using errcode='23514'; end if;
 return new;
end $$;

drop trigger if exists financeiro_growth_formalizacao_empresa_guard on public.financeiro_growth;
create trigger financeiro_growth_formalizacao_empresa_guard
before insert or update of formalizacao_id,empresa_id on public.financeiro_growth
for each row execute function public.validar_financeiro_formalizacao_empresa();

notify pgrst, 'reload schema';
