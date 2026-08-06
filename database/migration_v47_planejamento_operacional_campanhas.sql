-- Migração v47 — Planejamento Operacional das Campanhas por empresa e projeto
alter table public.projetos_evolucao drop constraint if exists projetos_evolucao_status_check;
alter table public.projetos_evolucao add constraint projetos_evolucao_status_check check (status in ('Rascunho','Publicado','Aceito','Formalizado','Kickoff realizado','Implantação concluída','Cliente Ativo','Cancelado'));

create table if not exists public.planejamentos_campanhas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  projeto_evolucao_id uuid not null references public.projetos_evolucao(id) on delete cascade,
  recurso_id uuid references public.catalogo_recursos(id) on delete set null,
  plataforma text not null,
  objetivo text,
  investimento_recomendado numeric(12,2) not null default 0,
  investimento_aprovado numeric(12,2) not null default 0,
  executor text,
  publico_alvo text,
  regiao_atuacao text,
  landing_page_url text,
  conta_google_ads text,
  conta_meta_ads text,
  conversoes text,
  pixel text,
  catalogo text,
  whatsapp text,
  responsavel_configuracao text,
  prazo date,
  status text not null default 'Planejamento' check (status in ('Planejamento','Aguardando Material','Em Configuração','Em Aprovação','Publicada','Otimização','Pausada','Finalizada')),
  observacoes text,
  checklist jsonb not null default '{}'::jsonb,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(projeto_evolucao_id, recurso_id, plataforma)
);
create index if not exists planejamentos_campanhas_empresa_idx on public.planejamentos_campanhas(empresa_id);
create index if not exists planejamentos_campanhas_projeto_idx on public.planejamentos_campanhas(projeto_evolucao_id);
alter table public.planejamentos_campanhas enable row level security;
drop policy if exists "planejamentos_campanhas_service_role" on public.planejamentos_campanhas;
create policy "planejamentos_campanhas_service_role" on public.planejamentos_campanhas for all to service_role using (true) with check (true);
comment on table public.planejamentos_campanhas is 'Briefing operacional das campanhas, criado após o Kickoff e vinculado à empresa, projeto e solução contratada.';
