-- Migração v3 — Central Escala Growth
create table if not exists reunioes_estrategicas(id uuid primary key default gen_random_uuid(),empresa_id uuid references empresas on delete cascade,diagnostico_id uuid references diagnosticos on delete set null,responsavel text,data timestamptz,consultor text default 'Teófilo Oliveira Fagundes',status text default 'Agendada',observacoes text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists implantacoes(id uuid primary key default gen_random_uuid(),empresa_id uuid references empresas on delete cascade,plano_id uuid references planos_estrategicos on delete set null,status text default 'Planejamento',inicio date,fim_previsto date,observacoes text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists configuracoes(id uuid primary key default gen_random_uuid(),nome_empresa text default 'Escala Vendas',logo_url text,consultor text default 'Teófilo Oliveira Fagundes',cra text default '6000811',agenda_url text default 'https://cal.com/teofilo-fagundes-8o0j6j/60min',updated_at timestamptz default now());
alter table reunioes_estrategicas enable row level security;
alter table implantacoes enable row level security;
alter table configuracoes enable row level security;
create policy "equipe autenticada le reunioes" on reunioes_estrategicas for select to authenticated using(true);
create policy "equipe autenticada gerencia reunioes" on reunioes_estrategicas for all to authenticated using(true) with check(true);
create policy "equipe autenticada le implantacoes" on implantacoes for select to authenticated using(true);
create policy "equipe autenticada gerencia implantacoes" on implantacoes for all to authenticated using(true) with check(true);
create policy "equipe autenticada le configuracoes" on configuracoes for select to authenticated using(true);
create policy "equipe autenticada gerencia configuracoes" on configuracoes for all to authenticated using(true) with check(true);

