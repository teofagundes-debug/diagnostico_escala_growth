-- Migração v5 — Plano de Implantação Escala Growth
create table if not exists planos_implantacao(
 id uuid primary key default gen_random_uuid(), empresa_id uuid references empresas on delete cascade,
 diagnostico_id uuid unique references diagnosticos on delete cascade, plano_estrategico_id uuid references planos_estrategicos on delete set null,
 objetivo text, missoes jsonb default '[]'::jsonb, recursos jsonb default '[]'::jsonb,
 recursos_existentes jsonb default '{}'::jsonb, comparativo jsonb default '[]'::jsonb,
 cronograma jsonb default '[]'::jsonb, investimento jsonb default '{}'::jsonb,
 beneficios jsonb default '[]'::jsonb, observacoes text, status text default 'Rascunho',
 aceite_empresa text, aceite_responsavel text, aceite_consultor text, aceite_data timestamptz,
 assinatura_cliente text, assinatura_consultor text, created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table planos_implantacao enable row level security;
create policy "equipe autenticada le implantacao" on planos_implantacao for select to authenticated using(true);
create policy "equipe autenticada cria implantacao" on planos_implantacao for insert to authenticated with check(true);
create policy "equipe autenticada atualiza implantacao" on planos_implantacao for update to authenticated using(true) with check(true);

