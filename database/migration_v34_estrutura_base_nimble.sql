-- V34 - Regra central da estrutura obrigatória da Plataforma Nimble
-- Um marcador simples identifica soluções ativadoras; as três soluções-base são localizadas somente pelo código.

alter table if exists public.catalogo_recursos
  add column if not exists utiliza_plataforma_nimble boolean not null default false;

update public.catalogo_recursos
set utiliza_plataforma_nimble = true,
    updated_at = now()
where codigo in (
  'CRM-001',
  'WPP-001',
  'DAT-001',
  'IA-001',
  'IA-002',
  'INT-001',
  'MIG-001'
);

update public.catalogo_recursos
set utiliza_plataforma_nimble = false,
    updated_at = now()
where codigo in ('AUT-001','TRN-001','PLA-001');

comment on column public.catalogo_recursos.utiliza_plataforma_nimble is
  'Ativa automaticamente AUT-001, TRN-001 e PLA-001 na composição do projeto.';
