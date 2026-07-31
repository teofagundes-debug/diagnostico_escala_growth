begin;

alter table public.situacoes_comerciais_versoes
  add column if not exists responsavel text,
  add column if not exists observacoes text,
  add column if not exists motivo_alteracao text,
  add column if not exists origem text not null default 'Projeto de Evolução';

comment on table public.situacoes_comerciais_versoes is
  'Histórico imutável do contrato vigente. Projetos em negociação nunca alteram esta tabela.';
comment on column public.situacoes_comerciais_versoes.origem is
  'Situação Comercial Inicial, Edição Administrativa ou Projeto de Evolução formalizado.';
comment on column public.situacoes_comerciais_versoes.motivo_alteracao is
  'Obrigatório em edições administrativas posteriores à situação inicial.';

commit;
