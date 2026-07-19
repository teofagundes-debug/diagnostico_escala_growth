-- V30 - Biblioteca de Soluções Escala Growth
-- Amplia o catálogo existente sem quebrar integrações ou registros anteriores.

alter table if exists public.catalogo_recursos
  add column if not exists beneficios jsonb not null default '[]'::jsonb,
  add column if not exists pre_requisitos text,
  add column if not exists criterio_conclusao text,
  add column if not exists ordem_implantacao integer,
  add column if not exists semana_sugerida text,
  add column if not exists duracao_padrao integer,
  add column if not exists dependencias text;

alter table if exists public.catalogo_recursos
  drop constraint if exists catalogo_recursos_semana_sugerida_check;

alter table if exists public.catalogo_recursos
  add constraint catalogo_recursos_semana_sugerida_check
  check (
    semana_sugerida is null
    or semana_sugerida in ('Semana 1','Semana 2','Semana 3','Semana 4','Personalizado')
  );

alter table if exists public.catalogo_recursos
  drop constraint if exists catalogo_recursos_duracao_padrao_check;

alter table if exists public.catalogo_recursos
  add constraint catalogo_recursos_duracao_padrao_check
  check (duracao_padrao is null or duracao_padrao > 0);

comment on table public.catalogo_recursos is
  'Biblioteca de Soluções Escala Growth: fonte única comercial, operacional e de planejamento.';
comment on column public.catalogo_recursos.beneficios is 'Benefícios comerciais, um item por entrada.';
comment on column public.catalogo_recursos.pre_requisitos is 'Pré-requisitos operacionais da solução.';
comment on column public.catalogo_recursos.criterio_conclusao is 'Critério utilizado para considerar a solução concluída.';
comment on column public.catalogo_recursos.ordem_implantacao is 'Ordem padrão da solução no cronograma.';
comment on column public.catalogo_recursos.semana_sugerida is 'Semana padrão ou planejamento personalizado.';
comment on column public.catalogo_recursos.duracao_padrao is 'Duração padrão prevista em dias.';
comment on column public.catalogo_recursos.dependencias is 'Dependências operacionais da solução.';
