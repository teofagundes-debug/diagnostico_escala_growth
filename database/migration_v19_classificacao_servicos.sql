-- Migração v19 — classificação operacional dos serviços
alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_obrigatoriedade_check;

update public.catalogo_recursos
set obrigatoriedade = case
  when obrigatoriedade = 'Obrigatório' then 'Obrigatório'
  when nome in ('Google Ads','Meta Ads','Integração ERP','Integrações','API','Treinamento') then 'Sob Demanda'
  else 'Padrão'
end;

alter table public.catalogo_recursos alter column obrigatoriedade set default 'Padrão';
alter table public.catalogo_recursos add constraint catalogo_recursos_obrigatoriedade_check
check (obrigatoriedade in ('Obrigatório','Padrão','Sob Demanda'));

comment on column public.catalogo_recursos.obrigatoriedade is
'Classificação operacional: Obrigatório entra bloqueado; Padrão entra pré-selecionado; Sob Demanda depende de seleção manual.';

