begin;

alter table public.projetos_evolucao drop constraint if exists projetos_evolucao_status_check;

update public.projetos_evolucao set status=case
  when status in ('Publicado para o cliente','Aguardando aceite','Em análise','Aguardando aprovação interna','Aprovado') then 'Publicado'
  when status='Aceito' then 'Aceito'
  when status in ('Formalizado sem novo pagamento','Em implantação','Concluído','Ativo') then 'Formalizado'
  when status in ('Cancelado','Arquivado') then 'Cancelado'
  else 'Rascunho'
end;

alter table public.projetos_evolucao alter column status set default 'Rascunho';
alter table public.projetos_evolucao add constraint projetos_evolucao_status_check
  check (status in ('Rascunho','Publicado','Aceito','Formalizado','Cancelado'));

create index if not exists projetos_evolucao_rascunho_tipo_idx
  on public.projetos_evolucao(empresa_id,tipo)
  where status='Rascunho';

comment on column public.projetos_evolucao.status is
  'Ciclo oficial de governança: Rascunho, Publicado, Aceito, Formalizado ou Cancelado.';

commit;
