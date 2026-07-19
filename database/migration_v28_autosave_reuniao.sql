-- V28 - Autosave completo e controle de concorrência da Reunião Estratégica
alter table public.reunioes_estrategicas
  add column if not exists consultant_notes text,
  add column if not exists autosave_version bigint not null default 0;

update public.reunioes_estrategicas
set consultant_notes = nullif(dados_reuniao->>'observacoes_consultor','')
where consultant_notes is null
  and nullif(dados_reuniao->>'observacoes_consultor','') is not null;

update public.reunioes_estrategicas r
set consultant_notes = source.observacoes_consultor
from (
  select distinct on (reuniao_id) reuniao_id,observacoes_consultor
  from public.preparacoes_reuniao
  where reuniao_id is not null and nullif(observacoes_consultor,'') is not null
  order by reuniao_id,updated_at desc
) source
where source.reuniao_id=r.id and r.consultant_notes is null;

alter table public.reunioes_estrategicas
  drop constraint if exists reunioes_estrategicas_autosave_version_check;
alter table public.reunioes_estrategicas
  add constraint reunioes_estrategicas_autosave_version_check
  check (autosave_version >= 0);

comment on column public.reunioes_estrategicas.consultant_notes is
  'Observações internas permanentes do consultor; nunca exibidas ao cliente.';
comment on column public.reunioes_estrategicas.autosave_version is
  'Versão monotônica usada para impedir que um autosave antigo sobrescreva conteúdo mais recente.';
