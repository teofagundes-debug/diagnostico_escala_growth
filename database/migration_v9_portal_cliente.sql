-- Portal do Cliente Escala Growth
create table if not exists public.portal_usuarios(
 id uuid primary key default gen_random_uuid(), auth_user_id uuid unique, email text unique not null,
 empresa_id uuid references public.empresas on delete cascade, perfil text not null default 'cliente' check(perfil in ('consultor','cliente')),
 boas_vindas_concluida boolean default false, ativo boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists portal_usuarios_empresa_idx on public.portal_usuarios(empresa_id);

create table if not exists public.contratos_growth(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas on delete cascade,
 plano_implantacao_id uuid references public.planos_implantacao on delete set null, titulo text default 'Contrato Escala Growth',
 conteudo text, status text default 'Rascunho', versao text default '1.0', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.aceites_growth(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas on delete cascade,
 plano_implantacao_id uuid references public.planos_implantacao on delete set null, usuario_id uuid references public.portal_usuarios on delete set null,
 responsavel text, cargo text, concorda_plano_estrategico boolean not null, concorda_plano_implantacao boolean not null,
 concorda_proposta boolean not null, concorda_contrato boolean not null, ip text, user_agent text,
 status text default 'Proposta aceita', aceito_em timestamptz default now(), created_at timestamptz default now()
);
create table if not exists public.pagamentos_growth(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas on delete cascade,
 aceite_id uuid references public.aceites_growth on delete set null, metodo text, status text default 'Pendente',
 valor numeric(12,2), referencia_externa text, confirmado_em timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.comunicacoes_growth(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas on delete cascade,
 diagnostico_id uuid references public.diagnosticos on delete set null, canal text check(canal in ('email','whatsapp')),
 destinatario text, assunto text, mensagem text, status text default 'Preparada', enviada_em timestamptz, created_at timestamptz default now()
);

alter table public.portal_usuarios enable row level security;
alter table public.contratos_growth enable row level security;
alter table public.aceites_growth enable row level security;
alter table public.pagamentos_growth enable row level security;
alter table public.comunicacoes_growth enable row level security;

do $$ begin create policy "equipe gerencia usuarios portal" on public.portal_usuarios for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;
do $$ begin create policy "equipe gerencia contratos" on public.contratos_growth for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;
do $$ begin create policy "equipe gerencia aceites" on public.aceites_growth for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;
do $$ begin create policy "equipe gerencia pagamentos" on public.pagamentos_growth for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;
do $$ begin create policy "equipe gerencia comunicacoes" on public.comunicacoes_growth for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;

-- Vincula automaticamente clientes já cadastrados pelo e-mail do responsável.
insert into public.portal_usuarios(email,empresa_id,perfil)
select distinct lower(r.email),r.empresa_id,'cliente' from public.responsaveis r where nullif(trim(r.email),'') is not null
on conflict(email) do update set empresa_id=excluded.empresa_id,updated_at=now();

