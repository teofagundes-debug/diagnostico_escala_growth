-- Política contratual única da Escala Growth
-- Normaliza dados existentes e impede novos prazos diferentes de 12 meses.

update public.parametros_comerciais
set prazo_contratual = 12,
    multa_atraso = null,
    updated_at = now()
where prazo_contratual is distinct from 12
   or multa_atraso is not null;

update public.financeiro_growth
set prazo_contratual = 12,
    updated_at = now()
where prazo_contratual is distinct from 12;

alter table public.parametros_comerciais
  drop constraint if exists parametros_comerciais_prazo_contratual_check;

alter table public.parametros_comerciais
  add constraint parametros_comerciais_prazo_contratual_check
  check (prazo_contratual = 12);

alter table public.financeiro_growth
  drop constraint if exists financeiro_growth_prazo_contratual_check;

alter table public.financeiro_growth
  add constraint financeiro_growth_prazo_contratual_check
  check (prazo_contratual = 12);

comment on column public.parametros_comerciais.prazo_contratual is
  'Prazo contratual institucional único da Escala Growth: 12 meses.';

comment on column public.financeiro_growth.prazo_contratual is
  'Prazo contratual institucional único da Escala Growth: 12 meses.';
