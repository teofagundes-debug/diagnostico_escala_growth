-- Biblioteca de Soluções Escala Growth — Arquitetura 3.0
-- Conhecimento permanente vive no catálogo; decisões negociadas permanecem no projeto.

alter table public.catalogo_recursos
  add column if not exists tipo_comercial text,
  add column if not exists classificacao_comercial text,
  add column if not exists resultado_esperado text,
  add column if not exists criterios_recomendacao jsonb not null default '[]'::jsonb,
  add column if not exists quando_recomendar text,
  add column if not exists quando_nao_recomendar text,
  add column if not exists valor_implantacao_padrao numeric(12,2),
  add column if not exists valor_mensalidade_padrao numeric(12,2),
  add column if not exists recursos_relacionados uuid[] not null default '{}'::uuid[],
  add column if not exists dependencias_estruturadas jsonb not null default '[]'::jsonb,
  add column if not exists criterios_conclusao jsonb not null default '[]'::jsonb,
  add column if not exists impacta_financeiro boolean not null default true,
  add column if not exists impacta_cronograma boolean not null default true,
  add column if not exists impacta_implantacao boolean not null default true,
  add column if not exists cria_checklist boolean not null default false,
  add column if not exists disponivel_evolucao_futura boolean not null default true,
  add column if not exists titulo_pendencia_padrao text,
  add column if not exists rota_configuracao_padrao text,
  add column if not exists codigo_pendencia_padrao text;

update public.catalogo_recursos
set
  tipo_comercial = coalesce(tipo_comercial,
    case
      when tipo = 'Mensalidade' then 'Mensalidade'
      when tipo = 'Implantação' and coalesce(valor_mensal, 0) > 0 then 'Implantação + Mensalidade'
      else 'Implantação'
    end),
  classificacao_comercial = coalesce(classificacao_comercial,
    case obrigatoriedade
      when 'Obrigatório' then 'Obrigatório'
      when 'Sob Demanda' then 'Complementar'
      else 'Opcional'
    end),
  valor_mensalidade_padrao = coalesce(valor_mensalidade_padrao, valor_mensal),
  criterios_conclusao = case
    when criterios_conclusao = '[]'::jsonb and nullif(trim(criterio_conclusao), '') is not null
      then jsonb_build_array(jsonb_build_object('titulo', trim(criterio_conclusao), 'obrigatorio', true))
    else criterios_conclusao
  end,
  dependencias_estruturadas = case
    when dependencias_estruturadas = '[]'::jsonb and nullif(trim(dependencias), '') is not null
      then jsonb_build_array(jsonb_build_object('tipo', 'condicao', 'descricao', trim(dependencias)))
    else dependencias_estruturadas
  end;

-- Critérios iniciais preservam o comportamento atual, agora parametrizados no banco.
update public.catalogo_recursos
set criterios_recomendacao = case
  when lower(nome) like '%google ads%' or lower(nome) like '%meta ads%' or lower(nome) like '%landing page%'
    then '["atrair","lead","campanha","marketing","oportunidade"]'::jsonb
  when lower(nome) like '%whatsapp%'
    then '["atrair","converter","whatsapp","atendimento","retorno"]'::jsonb
  when lower(nome) like '%crm%' or lower(nome) like '%dashboard%'
    then '["converter","crescer","acompanhar","processo","indicador","previsibilidade"]'::jsonb
  when lower(nome) like '%treinamento%'
    then '["equipe","processo","padronização","atendimento"]'::jsonb
  else criterios_recomendacao
end
where criterios_recomendacao = '[]'::jsonb;

update public.catalogo_recursos set
  gera_pendencias = true,
  codigo_pendencia_padrao = 'MARKETING_PARAMETROS',
  titulo_pendencia_padrao = 'Planejamento Operacional das Campanhas',
  rota_configuracao_padrao = '/central/planejamento-operacional'
where lower(nome) like any (array['%google ads%','%meta ads%','%landing page%','%campanhas whatsapp%','%estratégia comercial digital%']);

update public.catalogo_recursos set codigo_pendencia_padrao='CRM_PIPELINE', titulo_pendencia_padrao='Definir Pipeline Comercial'
where gera_pendencias=true and lower(nome) like '%crm%';
update public.catalogo_recursos set codigo_pendencia_padrao='DASHBOARD_INDICADORES', titulo_pendencia_padrao='Definir Indicadores'
where gera_pendencias=true and (lower(nome) like '%dashboard%' or lower(nome) like '%business intelligence%');
update public.catalogo_recursos set codigo_pendencia_padrao='WHATSAPP_NUMERO', titulo_pendencia_padrao='Validar Número do WhatsApp'
where gera_pendencias=true and lower(nome) = 'whatsapp oficial';

alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_tipo_comercial_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_tipo_comercial_check
  check (tipo_comercial is null or tipo_comercial in ('Implantação','Mensalidade','Implantação + Mensalidade'));

alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_classificacao_comercial_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_classificacao_comercial_check
  check (classificacao_comercial is null or classificacao_comercial in ('Obrigatório','Opcional','Complementar'));

alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_faixa_investimento_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_faixa_investimento_check check (
  investimento_ideal_minimo is null or investimento_ideal_maximo is null
  or investimento_ideal_maximo >= investimento_ideal_minimo
);

notify pgrst, 'reload schema';
