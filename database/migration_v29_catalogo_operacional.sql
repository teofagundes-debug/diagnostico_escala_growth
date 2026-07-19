-- V29 - Conteúdo operacional do Catálogo Comercial
-- Fonte única para geração automática do Plano de Implantação.

alter table if exists public.catalogo_recursos
  add column if not exists objetivo_padrao text,
  add column if not exists entregas_padrao jsonb not null default '[]'::jsonb,
  add column if not exists recursos_envolvidos jsonb not null default '[]'::jsonb,
  add column if not exists descricao_tecnica text;

comment on column public.catalogo_recursos.objetivo_padrao is
  'Objetivo operacional utilizado automaticamente no Plano de Implantação.';
comment on column public.catalogo_recursos.entregas_padrao is
  'Lista de entregas padrão do serviço.';
comment on column public.catalogo_recursos.recursos_envolvidos is
  'Lista de recursos envolvidos na implantação do serviço.';
comment on column public.catalogo_recursos.descricao_tecnica is
  'Descrição técnica interna utilizada no documento operacional.';
