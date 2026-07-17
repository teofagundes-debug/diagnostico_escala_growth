-- Migração v16 — automação do fluxo operacional da Central Escala Growth
alter table public.reunioes_estrategicas add column if not exists tipo text default 'Reunião Estratégica';
alter table public.reunioes_estrategicas add column if not exists hora time;
alter table public.reunioes_estrategicas add column if not exists duracao integer default 60;
alter table public.reunioes_estrategicas add column if not exists responsavel_nome text;
alter table public.reunioes_estrategicas add column if not exists realizada_em timestamptz;
alter table public.planos_estrategicos add column if not exists reuniao_id uuid references public.reunioes_estrategicas on delete set null;
alter table public.planos_estrategicos add column if not exists liberado_cliente boolean not null default false;
alter table public.planos_estrategicos add column if not exists liberado_em timestamptz;
create index if not exists reunioes_empresa_data_idx on public.reunioes_estrategicas(empresa_id,data desc);
create index if not exists diagnosticos_empresa_status_idx on public.diagnosticos(empresa_id,status);

