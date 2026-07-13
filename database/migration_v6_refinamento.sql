alter table planos_implantacao add column if not exists meta_ieg jsonb default '{}'::jsonb;
alter table planos_implantacao add column if not exists indicadores jsonb default '[]'::jsonb;

