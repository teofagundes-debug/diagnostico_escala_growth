begin;

alter table public.projetos_evolucao
  add column if not exists motivo_implantacao text,
  add column if not exists forma_pagamento_implantacao text,
  add column if not exists forma_pagamento_mensal text,
  add column if not exists checklist jsonb not null default '{}'::jsonb,
  add column if not exists situacao_atual_conferida boolean not null default false,
  add column if not exists responsavel_atualizacao text;

alter table public.projetos_evolucao drop constraint if exists projetos_evolucao_tipo_check;
update public.projetos_evolucao set tipo=case tipo
  when 'Adesão ao Método' then 'Adesão ao Método Escala Growth'
  when 'Novo recurso' then 'Inclusão de novo recurso'
  when 'Expansão' then 'Expansão de recurso existente'
  when 'Upgrade' then 'Upgrade de plano'
  when 'Substituição' then 'Substituição de recurso'
  else tipo end;
alter table public.projetos_evolucao add constraint projetos_evolucao_tipo_check check (tipo in (
 'Adesão ao Método Escala Growth','Inclusão de novo recurso','Expansão de recurso existente',
 'Upgrade de plano','Substituição de recurso','Ajuste contratual','Renovação','Outro'));

alter table public.projetos_evolucao drop constraint if exists projetos_evolucao_status_check;
update public.projetos_evolucao set status=case status
  when 'Em elaboração' then 'Rascunho'
  when 'Em análise' then 'Em análise'
  when 'Aguardando aprovação' then 'Aguardando aprovação interna'
  when 'Publicado' then 'Publicado para o cliente'
  when 'Ativo' then 'Em implantação'
  else status end;
alter table public.projetos_evolucao alter column status set default 'Rascunho';
alter table public.projetos_evolucao add constraint projetos_evolucao_status_check check (status in (
 'Rascunho','Em análise','Aguardando aprovação interna','Aprovado','Publicado para o cliente',
 'Aguardando aceite','Aceito','Aguardando pagamento','Formalizado sem novo pagamento',
 'Em implantação','Concluído','Cancelado','Arquivado'));

alter table public.projetos_evolucao drop constraint if exists projetos_evolucao_forma_cobranca_check;
update public.projetos_evolucao set forma_cobranca=case forma_cobranca
 when 'Recorrência existente' then 'Cobrança recorrente existente'
 when 'Assinatura' then 'Cartão recorrente'
 when 'Transferência' then 'Outro'
 else forma_cobranca end;
alter table public.projetos_evolucao add constraint projetos_evolucao_forma_cobranca_check check (forma_cobranca in (
 'PIX','Cartão','Cartão recorrente','Cobrança recorrente existente','Link de pagamento','Sem cobrança imediata','Outro'));

alter table public.projetos_evolucao drop constraint if exists projetos_evolucao_formalizacao_check;
update public.projetos_evolucao set formalizacao=case formalizacao
 when 'Aceite eletrônico' then 'Termo de adesão ao Método Escala Growth'
 else formalizacao end;
alter table public.projetos_evolucao alter column formalizacao set default 'Termo de adesão ao Método Escala Growth';
alter table public.projetos_evolucao add constraint projetos_evolucao_formalizacao_check check (formalizacao in (
 'Novo contrato','Aditivo contratual','Termo de adesão ao Método Escala Growth',
 'Renovação contratual','Sem novo documento','Outro'));

comment on column public.projetos_evolucao.checklist is 'Estado do checklist adaptativo, registrado por Projeto de Evolução.';
comment on column public.projetos_evolucao.observacoes_internas is 'Informação interna; nunca é entregue ao cliente.';
commit;
