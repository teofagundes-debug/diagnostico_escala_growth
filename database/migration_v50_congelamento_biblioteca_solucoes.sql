-- Refinamento final e congelamento arquitetural da Biblioteca de Soluções.
-- `tipo` e `classificacao_comercial` tornam-se as referências únicas.

alter table public.catalogo_recursos
  drop constraint if exists catalogo_recursos_tipo_check,
  drop constraint if exists catalogo_recursos_valores_por_tipo_check,
  drop constraint if exists catalogo_recursos_classificacao_comercial_check,
  drop constraint if exists catalogo_recursos_faixa_investimento_check,
  drop constraint if exists catalogo_recursos_obrigatoriedade_check;

update public.catalogo_recursos
set
  tipo = case
    when tipo_comercial in ('Implantação','Mensalidade','Implantação + Mensalidade') then tipo_comercial
    when tipo = 'Mensalidade' then 'Mensalidade'
    else 'Implantação'
  end,
  classificacao_comercial = case
    when classificacao_comercial in ('Obrigatório','Obrigatória') then 'Obrigatória'
    when classificacao_comercial = 'Complementar' then 'Complementar'
    when obrigatoriedade = 'Obrigatório' then 'Obrigatória'
    when obrigatoriedade = 'Sob Demanda' then 'Complementar'
    else 'Opcional'
  end,
  valor_mensal = case
    when coalesce(tipo_comercial, tipo) in ('Mensalidade','Implantação + Mensalidade')
      then coalesce(valor_mensalidade_padrao, valor_mensal, 0)
    else null
  end,
  ui = case
    when coalesce(tipo_comercial, tipo) in ('Implantação','Implantação + Mensalidade')
      then coalesce(ui, 1)
    else null
  end,
  ordem_implantacao = case when coalesce(tipo_comercial, tipo)='Mensalidade' then null else ordem_implantacao end,
  semana_sugerida = case when coalesce(tipo_comercial, tipo)='Mensalidade' then null else semana_sugerida end,
  tempo_medio_implantacao = case when coalesce(tipo_comercial, tipo)='Mensalidade' then null else coalesce(tempo_medio_implantacao, duracao_padrao) end,
  duracao_padrao = case when coalesce(tipo_comercial, tipo)='Mensalidade' then null else coalesce(tempo_medio_implantacao, duracao_padrao) end;

alter table public.catalogo_recursos
  add constraint catalogo_recursos_tipo_check
    check (tipo in ('Implantação','Mensalidade','Implantação + Mensalidade')),
  add constraint catalogo_recursos_classificacao_comercial_check
    check (classificacao_comercial in ('Obrigatória','Complementar','Opcional')),
  add constraint catalogo_recursos_valores_por_tipo_check check (
    (tipo='Implantação' and ui is not null and ui > 0 and valor_mensal is null)
    or (tipo='Mensalidade' and ui is null and valor_mensal is not null and valor_mensal >= 0)
    or (tipo='Implantação + Mensalidade' and ui is not null and ui > 0 and valor_mensal is not null and valor_mensal >= 0)
  );

alter table if exists public.projeto_solucoes_vinculadas drop constraint if exists projeto_solucoes_vinculadas_tipo_check;
alter table if exists public.projeto_solucoes_vinculadas add constraint projeto_solucoes_vinculadas_tipo_check
  check (tipo in ('Implantação','Mensalidade','Implantação + Mensalidade'));
alter table if exists public.projeto_solucoes_aprovadas drop constraint if exists projeto_solucoes_tipo_check;
alter table if exists public.projeto_solucoes_aprovadas add constraint projeto_solucoes_tipo_check
  check (tipo in ('Implantação','Implantação + Mensalidade'));

-- Remoção definitiva das fontes duplicadas. Snapshots históricos dos projetos são preservados.
alter table public.catalogo_recursos
  drop column if exists tipo_comercial,
  drop column if exists obrigatoriedade,
  drop column if exists prioridade,
  drop column if exists tipo_implantacao,
  drop column if exists investimento_ideal_minimo,
  drop column if exists investimento_ideal_maximo;

comment on column public.catalogo_recursos.tipo is 'Natureza única da solução: Implantação, Mensalidade ou Implantação + Mensalidade.';
comment on column public.catalogo_recursos.classificacao_comercial is 'Classificação única da solução, extensível por migration futura.';
comment on column public.catalogo_recursos.investimento_minimo_recomendado is 'Valor mínimo recomendado pelo Método Escala Growth para viabilidade operacional e possibilidade consistente de geração de resultados.';

notify pgrst, 'reload schema';
