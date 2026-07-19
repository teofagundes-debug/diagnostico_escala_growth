-- V27 - Persistência explícita dos campos internos da Reunião Estratégica
alter table public.reunioes_estrategicas
  add column if not exists consultant_initial_hypothesis text,
  add column if not exists prepared_specific_questions text;

-- Recupera primeiro o documento único já consolidado.
update public.reunioes_estrategicas
set consultant_initial_hypothesis = nullif(dados_reuniao->>'hipotese_inicial','')
where consultant_initial_hypothesis is null
  and nullif(dados_reuniao->>'hipotese_inicial','') is not null;

update public.reunioes_estrategicas
set prepared_specific_questions = nullif(dados_reuniao->>'perguntas_especificas','')
where prepared_specific_questions is null
  and nullif(dados_reuniao->>'perguntas_especificas','') is not null;

-- Recupera a entidade antiga apenas quando a coluna da reunião ainda está vazia
-- e existe uma correspondência segura pelo identificador da reunião.
update public.reunioes_estrategicas r
set consultant_initial_hypothesis = source.hipotese_inicial
from (
  select distinct on (reuniao_id) reuniao_id,hipotese_inicial
  from public.preparacoes_reuniao
  where reuniao_id is not null and nullif(hipotese_inicial,'') is not null
  order by reuniao_id,updated_at desc
) source
where source.reuniao_id=r.id and r.consultant_initial_hypothesis is null;

update public.reunioes_estrategicas r
set prepared_specific_questions = source.perguntas_especificas
from (
  select distinct on (reuniao_id) reuniao_id,perguntas_especificas
  from public.preparacoes_reuniao
  where reuniao_id is not null and nullif(perguntas_especificas,'') is not null
  order by reuniao_id,updated_at desc
) source
where source.reuniao_id=r.id and r.prepared_specific_questions is null;

comment on column public.reunioes_estrategicas.consultant_initial_hypothesis is
  'Hipótese inicial interna e permanente do consultor para esta reunião.';
comment on column public.reunioes_estrategicas.prepared_specific_questions is
  'Perguntas específicas preparadas e permanentes desta reunião.';
