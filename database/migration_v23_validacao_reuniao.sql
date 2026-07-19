-- V23 - Registro persistente e histórico da validação da Reunião Estratégica
alter table public.preparacoes_reuniao
  add column if not exists problema_principal text,
  add column if not exists ajustes_diagnostico text,
  add column if not exists prioridades_confirmadas text,
  add column if not exists recomendacoes_aprovadas text,
  add column if not exists recomendacoes_removidas text,
  add column if not exists novas_recomendacoes text,
  add column if not exists informacoes_complementares text,
  add column if not exists missao_definida text,
  add column if not exists indicadores_sugeridos text,
  add column if not exists observacoes_consultor text,
  add column if not exists parecer_consultor text,
  add column if not exists responsavel_reuniao text,
  add column if not exists ultima_alteracao_em timestamptz;

create table if not exists public.reuniao_estrategica_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  diagnostico_id uuid not null references public.diagnosticos(id) on delete cascade,
  reuniao_id uuid references public.reunioes_estrategicas(id) on delete cascade,
  preparacao_id uuid references public.preparacoes_reuniao(id) on delete cascade,
  acao text not null,
  responsavel text not null,
  status text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reuniao_historico_reuniao_idx
  on public.reuniao_estrategica_historico(reuniao_id,created_at desc);

alter table public.reuniao_estrategica_historico enable row level security;
drop policy if exists "master gerencia historico reuniao" on public.reuniao_estrategica_historico;
create policy "master gerencia historico reuniao"
  on public.reuniao_estrategica_historico for all to authenticated
  using (true) with check (true);

comment on column public.preparacoes_reuniao.observacoes_consultor is
  'Conteúdo estritamente interno; nunca deve ser exposto ao cliente ou copiado automaticamente para o Plano Estratégico.';
comment on column public.preparacoes_reuniao.parecer_consultor is
  'Conteúdo oficial consolidado que pode ser apresentado ao cliente no Plano Estratégico.';

alter table public.planos_estrategicos
  add column if not exists parecer_consultor text;
comment on column public.planos_estrategicos.parecer_consultor is
  'Parecer oficial do consultor, revisado para apresentação ao cliente.';

