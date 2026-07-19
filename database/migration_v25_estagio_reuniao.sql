-- V25 - Estado operacional da preparação gravado na própria reunião
alter table public.reunioes_estrategicas
  add column if not exists preparacao_id uuid references public.preparacoes_reuniao(id) on delete set null,
  add column if not exists etapa_atual text not null default 'Preparação não iniciada',
  add column if not exists prontidao_percentual integer not null default 0;

update public.reunioes_estrategicas r
set preparacao_id=p.id,
    etapa_atual=case
      when p.status='Concluída' then 'Reunião concluída'
      when p.status='Em condução' then 'Reunião iniciada'
      when (select count(*) from jsonb_each_text(coalesce(p.prontidao,'{}'::jsonb)) x where x.value='true') >= 6 then 'Preparação concluída'
      else 'Preparação em andamento'
    end,
    prontidao_percentual=least(100,round((select count(*) from jsonb_each_text(coalesce(p.prontidao,'{}'::jsonb)) x where x.value='true')*100.0/6)::integer)
from public.preparacoes_reuniao p
where p.reuniao_id=r.id;

update public.reunioes_estrategicas
set etapa_atual='Reunião concluída',prontidao_percentual=100
where status='Realizada';

comment on column public.reunioes_estrategicas.etapa_atual is
  'Estado operacional persistente usado pela Agenda; evita depender de consultas secundárias para identificar a continuidade da preparação.';

