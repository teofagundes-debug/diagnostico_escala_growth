-- Precificação interna por Unidade de Implantação (UI)
create table if not exists public.parametros_comerciais(
 id uuid primary key default gen_random_uuid(), valor_ui numeric(12,2) not null default 350,
 desconto_pix numeric(5,2) not null default 10, prazo_contratual integer not null default 12,
 validade_proposta integer not null default 15, reajuste_anual numeric(5,2) default 0,
 updated_at timestamptz default now()
);
insert into public.parametros_comerciais(valor_ui,desconto_pix,prazo_contratual,validade_proposta)
select 350,10,12,15 where not exists(select 1 from public.parametros_comerciais);

create table if not exists public.catalogo_recursos(
 id uuid primary key default gen_random_uuid(), codigo text unique not null, categoria text not null,
 nome text not null, descricao text, tipo text default 'Implantação', ui numeric(8,2) not null default 1,
 responsavel text, prioridade text default 'Média', observacoes text, ativo boolean default true,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
insert into public.catalogo_recursos(codigo,categoria,nome,descricao,ui,responsavel,prioridade) values
('CRM-001','Operação','CRM','Centralização de oportunidades e histórico comercial.',8,'Escala Vendas','Alta'),
('IA-001','Automação','Agente de IA','Apoio inteligente a tarefas e atendimento.',13,'Escala Vendas','Alta'),
('WPP-001','Comunicação','WhatsApp Oficial','Organização de conversas e integrações autorizadas.',5,'Escala Vendas','Média'),
('DAT-001','Dados','Dashboard','Consolidação dos indicadores da operação.',5,'Escala Vendas','Alta'),
('AUT-001','Automação','Automações','Conexão de etapas e redução de tarefas manuais.',8,'Escala Vendas','Média'),
('MKT-001','Aquisição','Meta Ads','Estruturação de campanhas e acompanhamento.',3,'Escala Vendas','Média'),
('MKT-002','Aquisição','Google Ads','Estruturação de campanhas de intenção.',3,'Escala Vendas','Média'),
('WEB-001','Conversão','Landing Page','Estruturação da página de conversão.',5,'Escala Vendas','Média'),
('INT-001','Integração','Integrações','Conexão entre tecnologias existentes.',8,'Escala Vendas','Alta'),
('API-001','Integração','API','Comunicação segura entre sistemas.',13,'Escala Vendas','Alta'),
('TRN-001','Pessoas','Treinamento','Preparação da equipe para o processo definido.',3,'Escala Vendas','Alta')
on conflict(codigo) do nothing;

alter table public.planos_implantacao add column if not exists total_ui numeric(10,2) default 0;
alter table public.planos_implantacao add column if not exists valor_ui numeric(12,2) default 0;
alter table public.planos_implantacao add column if not exists valor_implantacao numeric(12,2) default 0;
alter table public.planos_implantacao add column if not exists validade_proposta integer default 15;
alter table public.financeiro_growth add column if not exists validade_proposta integer default 15;

alter table public.parametros_comerciais enable row level security;
alter table public.catalogo_recursos enable row level security;
do $$ begin create policy "admin gerencia parametros comerciais" on public.parametros_comerciais for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;
do $$ begin create policy "admin gerencia catalogo recursos" on public.catalogo_recursos for all to authenticated using(true) with check(true); exception when duplicate_object then null; end $$;

