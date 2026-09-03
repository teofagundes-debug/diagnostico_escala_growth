-- V68 — Linha independente: Implantação de Ferramentas / Fase 1.
create table if not exists public.projetos_implantacao_ferramentas (
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null references public.empresas(id) on delete restrict,
 responsavel_id uuid not null references public.responsaveis(id) on delete restrict,
 tipo_servico text not null default 'IMPLANTACAO_FERRAMENTAS' check(tipo_servico='IMPLANTACAO_FERRAMENTAS'),
 area_interesse text not null check(area_interesse in ('COMERCIAL','ATENDIMENTO','COMERCIAL_E_ATENDIMENTO')),
 solucoes_selecionadas jsonb not null default '[]'::jsonb,
 respostas_questionario jsonb not null default '{}'::jsonb,
 configuracao_sugerida jsonb not null default '{}'::jsonb,
 itens_validacao jsonb not null default '[]'::jsonb,
 status_comercial text not null default 'NOVO' check(status_comercial in ('NOVO','REUNIAO_AGENDADA','EM_VALIDACAO','VALIDADO','FORMALIZACAO')),
 sintese_necessidade text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.pre_propostas_implantacao (
 id uuid primary key default gen_random_uuid(),
 projeto_id uuid not null references public.projetos_implantacao_ferramentas(id) on delete cascade,
 versao integer not null default 1,
 status text not null default 'RASCUNHO' check(status in ('RASCUNHO','EM_VALIDACAO','VALIDADA','FORMALIZACAO_ENVIADA')),
 sintese text,
 configuracao jsonb not null default '{}'::jsonb,
 itens_implantacao jsonb not null default '[]'::jsonb,
 financeiro jsonb not null default '{"investimento_inicial":null,"licencas_mensais":null,"condicoes":null}'::jsonb,
 observacoes_internas text,
 snapshot_final jsonb,
 validada_em timestamptz,
 validada_por text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(projeto_id,versao)
);

create table if not exists public.pre_propostas_implantacao_historico (
 id uuid primary key default gen_random_uuid(),
 projeto_id uuid not null references public.projetos_implantacao_ferramentas(id) on delete cascade,
 pre_proposta_id uuid references public.pre_propostas_implantacao(id) on delete set null,
 evento text not null,
 descricao text not null,
 usuario text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index if not exists projetos_implantacao_ferramentas_empresa_idx on public.projetos_implantacao_ferramentas(empresa_id,created_at desc);
create index if not exists pre_propostas_implantacao_projeto_idx on public.pre_propostas_implantacao(projeto_id,versao desc);
create index if not exists pre_propostas_implantacao_historico_idx on public.pre_propostas_implantacao_historico(projeto_id,created_at desc);

alter table public.projetos_implantacao_ferramentas enable row level security;
alter table public.pre_propostas_implantacao enable row level security;
alter table public.pre_propostas_implantacao_historico enable row level security;
drop policy if exists "Service role gerencia projetos de ferramentas" on public.projetos_implantacao_ferramentas;
drop policy if exists "Service role gerencia pre propostas de ferramentas" on public.pre_propostas_implantacao;
drop policy if exists "Service role gerencia historico de ferramentas" on public.pre_propostas_implantacao_historico;
create policy "Service role gerencia projetos de ferramentas" on public.projetos_implantacao_ferramentas for all to service_role using(true) with check(true);
create policy "Service role gerencia pre propostas de ferramentas" on public.pre_propostas_implantacao for all to service_role using(true) with check(true);
create policy "Service role gerencia historico de ferramentas" on public.pre_propostas_implantacao_historico for all to service_role using(true) with check(true);

create or replace function public.registrar_diagnostico_implantacao(payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare e uuid; r uuid; p uuid; proposal uuid;
begin
 select responsavel.empresa_id,responsavel.id into e,r from public.responsaveis responsavel where lower(responsavel.email)=lower(payload->>'email') order by responsavel.created_at limit 1;
 if e is null then select id into e from public.empresas where lower(trim(nome))=lower(trim(payload->>'empresa')) order by created_at limit 1; end if;
 if e is null then insert into public.empresas(nome) values(payload->>'empresa') returning id into e; end if;
 if r is null then
  insert into public.responsaveis(empresa_id,nome,email,telefone) values(e,payload->>'nome',lower(payload->>'email'),payload->>'whatsapp') returning id into r;
 else
  update public.responsaveis set nome=payload->>'nome',telefone=payload->>'whatsapp' where id=r;
 end if;
 insert into public.projetos_implantacao_ferramentas(empresa_id,responsavel_id,area_interesse,solucoes_selecionadas,respostas_questionario,configuracao_sugerida,itens_validacao,sintese_necessidade)
 values(e,r,payload->>'area_interesse',coalesce(payload->'solucoes_selecionadas','[]'::jsonb),coalesce(payload->'respostas','{}'::jsonb),coalesce(payload->'configuracao_sugerida','{}'::jsonb),coalesce(payload->'itens_validacao','[]'::jsonb),payload->>'sintese') returning id into p;
 insert into public.pre_propostas_implantacao(projeto_id,sintese,configuracao,itens_implantacao)
 values(p,payload->>'sintese',coalesce(payload->'configuracao_sugerida','{}'::jsonb),coalesce(payload->'itens_implantacao','[]'::jsonb)) returning id into proposal;
 insert into public.pre_propostas_implantacao_historico(projeto_id,pre_proposta_id,evento,descricao,metadata)
 values(p,proposal,'QUESTIONARIO_CONCLUIDO','Questionário de Implantação concluído e pré-proposta interna criada.',jsonb_build_object('origem','DIAGNOSTICO_IMPLANTACAO'));
 return p;
end $$;

revoke all on function public.registrar_diagnostico_implantacao(jsonb) from public,anon,authenticated;
grant execute on function public.registrar_diagnostico_implantacao(jsonb) to service_role;
notify pgrst, 'reload schema';
