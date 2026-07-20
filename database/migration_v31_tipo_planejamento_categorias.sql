-- V31 - Tipo da solução, planejamento e categorias por natureza
-- Preserva os cadastros existentes e altera somente as categorias mapeadas.

alter table if exists public.catalogo_recursos
  alter column ordem_implantacao drop not null,
  alter column semana_sugerida drop not null,
  alter column duracao_padrao drop not null;

alter table if exists public.catalogo_recursos
  drop constraint if exists catalogo_recursos_semana_sugerida_check;

alter table if exists public.catalogo_recursos
  add constraint catalogo_recursos_semana_sugerida_check
  check (
    semana_sugerida is null
    or semana_sugerida = 'Personalizado'
    or semana_sugerida ~ '^Semana [1-9][0-9]*$'
  );

alter table if exists public.catalogo_recursos
  drop constraint if exists catalogo_recursos_ordem_implantacao_check;

alter table if exists public.catalogo_recursos
  add constraint catalogo_recursos_ordem_implantacao_check
  check (ordem_implantacao is null or ordem_implantacao > 0);

alter table if exists public.catalogo_recursos
  drop constraint if exists catalogo_recursos_duracao_padrao_check;

alter table if exists public.catalogo_recursos
  add constraint catalogo_recursos_duracao_padrao_check
  check (duracao_padrao is null or duracao_padrao > 0);

update public.catalogo_recursos
set categoria = case nome
  when 'Implantação Operacional' then 'Implantação Técnica'
  when 'Licença Plataforma Nimble' then 'Plataforma'
  when 'WhatsApp Oficial' then 'Comunicação'
  when 'CRM Comercial' then 'Gestão Comercial'
  when 'Treinamento da Equipe' then 'Capacitação'
  when 'Dashboard Executivo' then 'Business Intelligence'
  when 'Integrações' then 'Integração e Automação'
  when 'Importação de Base de Dados' then 'Migração de Dados'
  when 'Ativação e Treinamento de Agente de IA' then 'Inteligência Artificial'
  when 'Gestão de Agente de IA' then 'Inteligência Artificial'
  when 'Configuração Google Ads' then 'Marketing Digital'
  when 'Configuração Meta Ads' then 'Marketing Digital'
  when 'Landing Page Institucional' then 'Presença Digital'
  when 'Gestão Google Ads' then 'Marketing Digital'
  when 'Gestão Meta Ads' then 'Marketing Digital'
  else categoria
end
where nome in (
  'Implantação Operacional','Licença Plataforma Nimble','WhatsApp Oficial',
  'CRM Comercial','Treinamento da Equipe','Dashboard Executivo','Integrações',
  'Importação de Base de Dados','Ativação e Treinamento de Agente de IA',
  'Gestão de Agente de IA','Configuração Google Ads','Configuração Meta Ads',
  'Landing Page Institucional','Gestão Google Ads','Gestão Meta Ads'
);

comment on column public.catalogo_recursos.tipo is
  'Forma de comercialização: Implantação, Mensalidade ou Avulso.';
comment on column public.catalogo_recursos.categoria is
  'Natureza funcional da solução, independente da forma de comercialização.';
comment on column public.catalogo_recursos.ordem_implantacao is
  'Obrigatória para Implantação; opcional para Avulso; não utilizada em Mensalidade.';
comment on column public.catalogo_recursos.semana_sugerida is
  'Obrigatória para Implantação; opcional para Avulso; não utilizada em Mensalidade.';
comment on column public.catalogo_recursos.duracao_padrao is
  'Obrigatória para Implantação; opcional para Avulso; não utilizada em Mensalidade.';
