-- Migra??o v7 ? reparo idempotente das configura??es e identidade visual
create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  nome_empresa text default 'Escala Vendas',
  logo_url text,
  consultor text default 'Te?filo Oliveira Fagundes',
  cra text default '6000811',
  agenda_url text default 'https://cal.com/teofilo-fagundes-8o0j6j/60min',
  updated_at timestamptz default now()
);

alter table public.configuracoes add column if not exists telefone text;
alter table public.configuracoes add column if not exists whatsapp text;
alter table public.configuracoes add column if not exists email text;
alter table public.configuracoes add column if not exists website text;
alter table public.configuracoes add column if not exists instagram text;
alter table public.configuracoes add column if not exists linkedin text;
alter table public.configuracoes add column if not exists cargo text default 'Consultor';
alter table public.configuracoes add column if not exists assinatura_url text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('branding','branding',true,3145728,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set
  public=true,
  file_size_limit=3145728,
  allowed_mime_types=array['image/png','image/jpeg','image/webp'];

insert into public.configuracoes(nome_empresa)
select 'Escala Vendas'
where not exists(select 1 from public.configuracoes);

