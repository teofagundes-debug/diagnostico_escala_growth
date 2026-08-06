-- V48 — Biblioteca de Soluções como fonte oficial dos parâmetros do Método
alter table public.catalogo_recursos
  add column if not exists tipo_implantacao text,
  add column if not exists tempo_medio_implantacao integer,
  add column if not exists treinamento_obrigatorio boolean not null default false,
  add column if not exists gera_pendencias boolean not null default false,
  add column if not exists abre_planejamento_operacional boolean not null default false,
  add column if not exists permite_executor_terceiro boolean not null default true,
  add column if not exists permite_equipe_interna boolean not null default true,
  add column if not exists investimento_minimo_recomendado numeric(12,2) not null default 0,
  add column if not exists investimento_ideal_minimo numeric(12,2),
  add column if not exists investimento_ideal_maximo numeric(12,2),
  add column if not exists observacoes_estrategicas text;

alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_faixa_investimento_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_faixa_investimento_check check (
  investimento_minimo_recomendado >= 0 and
  (investimento_ideal_minimo is null or investimento_ideal_minimo >= 0) and
  (investimento_ideal_maximo is null or investimento_ideal_maximo >= coalesce(investimento_ideal_minimo,0))
);
alter table public.catalogo_recursos drop constraint if exists catalogo_recursos_tempo_medio_check;
alter table public.catalogo_recursos add constraint catalogo_recursos_tempo_medio_check check (tempo_medio_implantacao is null or tempo_medio_implantacao > 0);

alter table public.projeto_evolucao_recursos
  add column if not exists parametros_snapshot jsonb not null default '{}'::jsonb;

update public.catalogo_recursos
set tipo_implantacao=coalesce(tipo_implantacao,case when tipo='Implantação' then 'Implantação técnica' when tipo='Mensalidade' then 'Operação recorrente' else 'Entrega avulsa' end),
    tempo_medio_implantacao=coalesce(tempo_medio_implantacao,duracao_padrao),
    abre_planejamento_operacional=case when lower(nome) similar to '%(google ads|meta ads|landing page|campanhas whatsapp)%' then true else abre_planejamento_operacional end,
    gera_pendencias=case when lower(nome) similar to '%(google ads|meta ads|landing page|campanhas whatsapp|crm|agente de ia|dashboard|whatsapp)%' then true else gera_pendencias end
where tipo_implantacao is null or abre_planejamento_operacional=false or gera_pendencias=false;

comment on column public.catalogo_recursos.investimento_minimo_recomendado is 'Investimento mínimo recomendado pelo Método, copiado como snapshot na criação do projeto.';
comment on column public.catalogo_recursos.investimento_ideal_minimo is 'Limite inferior da faixa ideal recomendada.';
comment on column public.catalogo_recursos.investimento_ideal_maximo is 'Limite superior da faixa ideal recomendada.';
comment on column public.projeto_evolucao_recursos.parametros_snapshot is 'Parâmetros históricos da Biblioteca utilizados na geração deste projeto.';
