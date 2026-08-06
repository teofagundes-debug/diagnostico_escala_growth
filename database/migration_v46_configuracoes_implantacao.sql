begin;

alter table public.projeto_evolucao_recursos
  add column if not exists implantar_nesta_fase boolean,
  add column if not exists investimento_recomendado numeric(12,2),
  add column if not exists investimento_aprovado numeric(12,2),
  add column if not exists motivo_investimento text;

comment on column public.projeto_evolucao_recursos.implantar_nesta_fase is
  'Decisão comercial da fase atual. NULL indica configuração ainda pendente; false preserva a solução como evolução futura.';
comment on column public.projeto_evolucao_recursos.investimento_recomendado is
  'Recomendação técnica original do Método Escala Growth, preservada sem edição pelo consultor.';
comment on column public.projeto_evolucao_recursos.investimento_aprovado is
  'Investimento aprovado para a fase atual do projeto.';
comment on column public.projeto_evolucao_recursos.motivo_investimento is
  'Justificativa para diferença entre o investimento recomendado e o aprovado.';

commit;
