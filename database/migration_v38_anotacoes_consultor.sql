-- V38 - Anotacoes internas vinculadas ao diagnostico.
create table if not exists public.diagnostico_anotacoes_consultor (
 id uuid primary key default gen_random_uuid(),
 diagnostico_id uuid not null unique references public.diagnosticos(id) on delete cascade,
 empresa_id uuid not null references public.empresas(id) on delete cascade,
 conteudo text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists diagnostico_anotacoes_empresa_idx on public.diagnostico_anotacoes_consultor(empresa_id);
alter table public.diagnostico_anotacoes_consultor enable row level security;
-- Sem policy para anon/authenticated. Leitura e escrita somente pela API Master autorizada, via service_role.
comment on table public.diagnostico_anotacoes_consultor is 'Anotacoes internas da consultoria; nunca disponibilizadas ao Portal do Cliente ou documentos publicos.';
notify pgrst, 'reload schema';
