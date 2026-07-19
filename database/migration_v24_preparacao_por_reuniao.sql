-- V24 - Cada Reunião Estratégica possui uma única preparação persistente
alter table public.preparacoes_reuniao
  drop constraint if exists preparacoes_reuniao_diagnostico_id_key;

create unique index if not exists preparacoes_reuniao_reuniao_unique_idx
  on public.preparacoes_reuniao(reuniao_id)
  where reuniao_id is not null;

create index if not exists preparacoes_reuniao_diagnostico_idx
  on public.preparacoes_reuniao(diagnostico_id,updated_at desc);

comment on table public.preparacoes_reuniao is
  'Documento persistente e único por Reunião Estratégica, preservado da preparação até a consolidação do Plano Estratégico.';

