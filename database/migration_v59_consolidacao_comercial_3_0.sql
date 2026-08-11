-- Sprint 14: estado e snapshot canônicos da Consolidação Comercial 3.0.
alter table public.projetos_evolucao
  add column if not exists commercial_3_0_status text,
  add column if not exists commercial_3_0_snapshot jsonb,
  add column if not exists commercial_3_0_fingerprint text,
  add column if not exists commercial_3_0_consolidated_at timestamptz,
  add column if not exists commercial_3_0_consolidated_by text;

alter table public.projetos_evolucao drop constraint if exists projetos_evolucao_commercial_3_0_status_check;
alter table public.projetos_evolucao add constraint projetos_evolucao_commercial_3_0_status_check
  check (commercial_3_0_status is null or commercial_3_0_status in ('PENDENTE','PRONTO','DESATUALIZADO','ERRO'));

comment on column public.projetos_evolucao.commercial_3_0_snapshot is
  'Snapshot canônico e imutável por consolidação; copia valores e recursos já persistidos, sem recalcular preços.';

notify pgrst, 'reload schema';
