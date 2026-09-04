-- V70 — Resoluções estruturadas dos escopos tratados na reunião comercial.
alter table public.pre_propostas_implantacao
 add column if not exists resolucoes_escopo jsonb not null default '[]'::jsonb;

comment on column public.pre_propostas_implantacao.resolucoes_escopo is
 'Definição acordada, recurso canônico e quantidade usados para resolver escopos pendentes da pré-proposta.';

notify pgrst, 'reload schema';
