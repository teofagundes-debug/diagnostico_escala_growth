-- Migração v4 — branding, agenda completa e versões do plano
alter table configuracoes add column if not exists telefone text;
alter table configuracoes add column if not exists whatsapp text;
alter table configuracoes add column if not exists email text;
alter table configuracoes add column if not exists website text;
alter table configuracoes add column if not exists instagram text;
alter table configuracoes add column if not exists linkedin text;
alter table configuracoes add column if not exists cargo text default 'Consultor';
alter table configuracoes add column if not exists assinatura_url text;
alter table reunioes_estrategicas add column if not exists hora time;
alter table reunioes_estrategicas add column if not exists duracao integer default 60;
alter table reunioes_estrategicas add column if not exists responsavel_nome text;
create table if not exists plano_estrategico_versoes(id uuid primary key default gen_random_uuid(),plano_id uuid references planos_estrategicos on delete cascade,diagnostico_id uuid references diagnosticos on delete cascade,versao integer not null,consultor text not null,conteudo jsonb not null,status text default 'Rascunho',created_at timestamptz default now());
alter table plano_estrategico_versoes enable row level security;
create policy "equipe autenticada le versoes" on plano_estrategico_versoes for select to authenticated using(true);
create policy "equipe autenticada cria versoes" on plano_estrategico_versoes for insert to authenticated with check(true);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('branding','branding',true,3145728,array['image/png','image/jpeg','image/webp']) on conflict(id) do update set public=true,file_size_limit=3145728,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
create policy "branding leitura publica" on storage.objects for select using(bucket_id='branding');
create policy "branding equipe envia" on storage.objects for insert to authenticated with check(bucket_id='branding');
create policy "branding equipe atualiza" on storage.objects for update to authenticated using(bucket_id='branding') with check(bucket_id='branding');

