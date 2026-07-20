-- V33 - Compatibilidade do Plano de Implantação
-- Garante as colunas estruturadas utilizadas pela versão atual da Central.

alter table if exists public.planos_implantacao
  add column if not exists meta_ieg jsonb not null default '{}'::jsonb,
  add column if not exists indicadores jsonb not null default '[]'::jsonb,
  add column if not exists total_ui numeric(10,2) not null default 0,
  add column if not exists valor_ui numeric(12,2) not null default 0,
  add column if not exists valor_implantacao numeric(12,2) not null default 0,
  add column if not exists validade_proposta integer not null default 15;

comment on column public.planos_implantacao.indicadores is
  'Indicadores de sucesso definidos para acompanhamento do Plano de Implantação.';

comment on column public.planos_implantacao.meta_ieg is
  'Meta de evolução do Índice Escala Growth vinculada ao Plano de Implantação.';

-- Solicita ao PostgREST/Supabase a atualização imediata do cache do schema.
notify pgrst, 'reload schema';
