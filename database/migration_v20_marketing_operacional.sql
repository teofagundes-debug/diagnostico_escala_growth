-- Migração v20 — Marketing operacional e Catálogo Comercial como fonte única
alter table public.marketing_parametros
  add column if not exists servico_id uuid references public.catalogo_recursos on delete set null,
  add column if not exists regiao_atuacao text,
  add column if not exists publico_alvo text,
  add column if not exists verba_recomendada numeric(12,2) default 0,
  add column if not exists verba_aprovada numeric(12,2) default 0,
  add column if not exists landing_page_url text,
  add column if not exists conta_google_ads text,
  add column if not exists conta_meta_ads text,
  add column if not exists status_campanha text default 'Planejamento',
  add column if not exists observacoes_operacionais text;

insert into public.catalogo_recursos
(codigo,categoria,nome,descricao,tipo,ui,valor_mensal,valor_avulso,obrigatoriedade,responsavel,prioridade,ativo)
values
('MKT-GEST-GOOGLE','Marketing','Gestão Google Ads','Gestão recorrente e acompanhamento operacional das campanhas Google Ads.','Mensalidade',null,0,null,'Sob Demanda','Escala Vendas','Média',true),
('MKT-GEST-META','Marketing','Gestão Meta Ads','Gestão recorrente e acompanhamento operacional das campanhas Meta Ads.','Mensalidade',null,0,null,'Sob Demanda','Escala Vendas','Média',true)
on conflict(codigo) do update set
 categoria=excluded.categoria,nome=excluded.nome,descricao=excluded.descricao,tipo='Mensalidade',
 ui=null,valor_avulso=null,obrigatoriedade=excluded.obrigatoriedade,ativo=true,updated_at=now();

update public.marketing_parametros m
set servico_id=c.id,
    verba_recomendada=coalesce(nullif((m.investimentos->>'local')::numeric,0),m.verba_recomendada,0),
    ui=0,
    valor_gestao_mensal=0
from public.catalogo_recursos c
where c.nome=case when m.plataforma='Google Ads' then 'Gestão Google Ads' when m.plataforma='Meta Ads' then 'Gestão Meta Ads' end;

comment on table public.marketing_parametros is
'Configurações exclusivamente operacionais de marketing. Preços comerciais pertencem somente ao catalogo_recursos.';


update public.financeiro_growth set google_gestao=null,meta_gestao=null,google_responsavel=null,meta_responsavel=null,google_investimento=null,meta_investimento=null;

