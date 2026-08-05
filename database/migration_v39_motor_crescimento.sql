begin;

alter table public.projeto_evolucao_recursos
  add column if not exists classificacao text not null default 'Recomendado',
  add column if not exists origem text,
  add column if not exists peso integer,
  add column if not exists fase text;

alter table public.projeto_evolucao_recursos drop constraint if exists projeto_evolucao_recursos_classificacao_check;
alter table public.projeto_evolucao_recursos add constraint projeto_evolucao_recursos_classificacao_check
  check (classificacao in ('Obrigatório','Recomendado','Opcional'));

alter table public.projeto_evolucao_recursos drop constraint if exists projeto_evolucao_recursos_peso_check;
alter table public.projeto_evolucao_recursos add constraint projeto_evolucao_recursos_peso_check
  check (peso is null or peso between 1 and 10);

comment on column public.projeto_evolucao_recursos.classificacao is 'Papel no Motor de Crescimento: Obrigatório, Recomendado ou Opcional.';
comment on column public.projeto_evolucao_recursos.origem is 'Origem da inclusão: Estrutura Base, Diagnóstico, gatilho automático ou consultor.';

insert into public.catalogo_recursos
  (codigo,categoria,nome,descricao,tipo,ui,valor_mensal,valor_avulso,obrigatoriedade,responsavel,prioridade,ativo)
values
  ('MKT-CAMP-WPP','Marketing Digital','Campanhas WhatsApp','Planejamento e ativação de campanhas comerciais pelo WhatsApp.','Implantação',3,null,null,'Sob Demanda','Escala Vendas','Alta',true),
  ('MKT-EST-DIG','Marketing Digital','Estratégia Comercial Digital','Definição da estratégia integrada de aquisição e conversão digital.','Implantação',3,null,null,'Sob Demanda','Escala Vendas','Alta',true)
on conflict (codigo) do update set
  categoria=excluded.categoria,nome=excluded.nome,descricao=excluded.descricao,tipo=excluded.tipo,
  ui=excluded.ui,valor_mensal=null,valor_avulso=null,obrigatoriedade=excluded.obrigatoriedade,
  prioridade=excluded.prioridade,ativo=true,updated_at=now();

commit;
