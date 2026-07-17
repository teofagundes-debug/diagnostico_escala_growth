-- Radar Comercial externo por empresa.
alter table public.empresas add column if not exists radar_comercial_url text;
alter table public.empresas add column if not exists radar_comercial_status text not null default 'Não configurado';
alter table public.empresas drop constraint if exists empresas_radar_comercial_status_check;
alter table public.empresas add constraint empresas_radar_comercial_status_check check(radar_comercial_status in ('Não configurado','Em configuração','Ativo','Inativo'));
comment on column public.empresas.radar_comercial_url is 'URL individual do Radar Comercial; preparada para futura substituição por integração nativa.';
