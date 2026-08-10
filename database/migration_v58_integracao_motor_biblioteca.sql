-- Sprint 13 - Ponte estrutural entre o Motor Estratégico 3.0 e a Biblioteca.
-- Não altera engines, projetos publicados, contratação ou precificação legada.

begin;

create table if not exists public.intervencao_solucoes (
  id uuid primary key default gen_random_uuid(),
  intervention_code text not null,
  solucao_id uuid not null references public.catalogo_recursos(id) on delete cascade,
  tipo_vinculo text not null,
  ordem integer not null default 0 check (ordem >= 0),
  ativo boolean not null default true,
  observacao_interna text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intervencao_solucoes_tipo_vinculo_check
    check (tipo_vinculo in ('PRINCIPAL','COMPLEMENTAR','PRE_REQUISITO','EVOLUCAO_FUTURA')),
  constraint intervencao_solucoes_intervencao_solucao_key
    unique (intervention_code, solucao_id)
);

create index if not exists intervencao_solucoes_intervention_code_idx
  on public.intervencao_solucoes(intervention_code);
create index if not exists intervencao_solucoes_solucao_id_idx
  on public.intervencao_solucoes(solucao_id);
create index if not exists intervencao_solucoes_ativo_idx
  on public.intervencao_solucoes(ativo);

alter table public.intervencao_solucoes enable row level security;
drop policy if exists "Service role gerencia vínculos estratégicos" on public.intervencao_solucoes;
create policy "Service role gerencia vínculos estratégicos"
  on public.intervencao_solucoes for all to service_role
  using (true) with check (true);

comment on table public.intervencao_solucoes is
  'Mapeamento administrativo entre intervention_codes canônicos e soluções comerciais. Não contém regras estratégicas nem preços.';
comment on column public.intervencao_solucoes.intervention_code is
  'Código estável proveniente do Motor de Intervenções 1.0; validado pela API contra o catálogo canônico do código.';

commit;
notify pgrst, 'reload schema';

