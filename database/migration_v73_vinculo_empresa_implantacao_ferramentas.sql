-- V73 — vínculo canônico e seguro da empresa na Implantação de Ferramentas.
-- Não cria produto, formalização, financeiro, contrato, portal, aceite ou pagamento.

alter table public.projetos_implantacao_ferramentas
 add column if not exists empresa_vinculo_criterio text,
 add column if not exists empresa_vinculo_ambiguidade boolean not null default false;

comment on column public.projetos_implantacao_ferramentas.empresa_vinculo_criterio is
 'Evidência utilizada para resolver a empresa canônica; nunca usa somente aproximação de nome.';
comment on column public.projetos_implantacao_ferramentas.empresa_vinculo_ambiguidade is
 'Indica que havia candidatos conflitantes e uma nova empresa neutra foi criada por segurança.';

create or replace function public.validar_projeto_ferramentas_empresa_responsavel()
returns trigger language plpgsql set search_path=public as $$
begin
 if not exists(
  select 1 from public.responsaveis contact
  where contact.id=new.responsavel_id and contact.empresa_id=new.empresa_id
 ) then
  raise exception 'O responsável não pertence à empresa do Projeto de Implantação.' using errcode='23514';
 end if;
 return new;
end $$;

drop trigger if exists projeto_ferramentas_empresa_responsavel_guard on public.projetos_implantacao_ferramentas;
create trigger projeto_ferramentas_empresa_responsavel_guard
before insert or update of empresa_id,responsavel_id on public.projetos_implantacao_ferramentas
for each row execute function public.validar_projeto_ferramentas_empresa_responsavel();

create or replace function public.registrar_diagnostico_implantacao(payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare
 e uuid; r uuid; p uuid; proposal uuid;
 normalized_email text:=lower(trim(coalesce(payload->>'email','')));
 normalized_phone text:=regexp_replace(coalesce(payload->>'whatsapp',''),'[^0-9]','','g');
 email_company_count integer:=0;
 phone_company_count integer:=0;
 intersection_company_count integer:=0;
 ambiguous boolean:=false;
 criterion text;
begin
 -- 1. E-mail exato e telefone normalizado juntos são a evidência mais forte.
 select count(distinct contact.empresa_id),min(contact.empresa_id::text)::uuid
 into intersection_company_count,e
 from public.responsaveis contact
 where normalized_email<>'' and normalized_phone<>''
   and lower(trim(contact.email))=normalized_email
   and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone;

 if intersection_company_count=1 then
  criterion:='EMAIL_E_WHATSAPP_EXATOS';
 else
  e:=null;
  select count(distinct contact.empresa_id),min(contact.empresa_id::text)::uuid
  into email_company_count,e
  from public.responsaveis contact
  where normalized_email<>'' and lower(trim(contact.email))=normalized_email;

  if email_company_count=1 then
   criterion:='EMAIL_EXATO';
  else
   e:=null;
   select count(distinct contact.empresa_id),min(contact.empresa_id::text)::uuid
   into phone_company_count,e
   from public.responsaveis contact
   where normalized_phone<>'' and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone;
   if phone_company_count=1 then criterion:='WHATSAPP_EXATO'; else e:=null; end if;
  end if;
 end if;

 ambiguous:=intersection_company_count>1 or email_company_count>1 or phone_company_count>1;

 -- Nome, isoladamente, não autoriza vínculo. Sem identidade segura nasce uma
 -- empresa canônica nova, neutra quanto ao produto contratado.
 if e is null then
  insert into public.empresas(nome) values(trim(payload->>'empresa')) returning id into e;
  criterion:=case when ambiguous then 'NOVA_EMPRESA_POR_AMBIGUIDADE' else 'NOVA_EMPRESA_SEM_CORRESPONDENCIA_SEGURA' end;
 end if;

 -- Reutiliza pessoa somente quando a identidade também pertence à empresa
 -- resolvida. Nunca move silenciosamente um contato entre empresas.
 select contact.id into r
 from public.responsaveis contact
 where contact.empresa_id=e and (
  (normalized_email<>'' and lower(trim(contact.email))=normalized_email) or
  (normalized_phone<>'' and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone)
 )
 order by
  (lower(trim(contact.email))=normalized_email and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone) desc,
  contact.created_at,contact.id
 limit 1;

 if r is null then
  insert into public.responsaveis(empresa_id,nome,email,telefone)
  values(e,trim(payload->>'nome'),normalized_email,normalized_phone) returning id into r;
 else
  update public.responsaveis
  set nome=trim(payload->>'nome'),email=normalized_email,telefone=normalized_phone
  where id=r and empresa_id=e;
 end if;

 insert into public.projetos_implantacao_ferramentas(
  empresa_id,responsavel_id,area_interesse,solucoes_selecionadas,respostas_questionario,
  configuracao_sugerida,itens_validacao,sintese_necessidade,
  empresa_vinculo_criterio,empresa_vinculo_ambiguidade
 ) values(
  e,r,payload->>'area_interesse',coalesce(payload->'solucoes_selecionadas','[]'::jsonb),
  coalesce(payload->'respostas','{}'::jsonb),coalesce(payload->'configuracao_sugerida','{}'::jsonb),
  coalesce(payload->'itens_validacao','[]'::jsonb),payload->>'sintese',criterion,ambiguous
 ) returning id into p;

 insert into public.pre_propostas_implantacao(projeto_id,sintese,configuracao,itens_implantacao)
 values(p,payload->>'sintese',coalesce(payload->'configuracao_sugerida','{}'::jsonb),coalesce(payload->'itens_implantacao','[]'::jsonb)) returning id into proposal;

 insert into public.pre_propostas_implantacao_historico(projeto_id,pre_proposta_id,evento,descricao,metadata)
 values(p,proposal,'QUESTIONARIO_CONCLUIDO','Questionário de Implantação concluído e pré-proposta interna criada.',
  jsonb_build_object('origem','DIAGNOSTICO_IMPLANTACAO','empresa_id',e,'responsavel_id',r,'vinculo_criterio',criterion,'ambiguidade',ambiguous));
 return p;
end $$;

revoke all on function public.registrar_diagnostico_implantacao(jsonb) from public,anon,authenticated;
grant execute on function public.registrar_diagnostico_implantacao(jsonb) to service_role;

-- A V68 já criou empresa_id e responsavel_id como NOT NULL. Esta visão também
-- detecta inconsistências relacionais em bases que tenham sido importadas.
create or replace view public.implantacao_ferramentas_vinculo_pendencias as
select project.id projeto_id,project.empresa_id,project.responsavel_id,
 case
  when company.id is null then 'EMPRESA_INEXISTENTE'
  when contact.id is null then 'RESPONSAVEL_INEXISTENTE'
  when contact.empresa_id<>project.empresa_id then 'RESPONSAVEL_DE_OUTRA_EMPRESA'
  else 'REVISAR_IDENTIDADE'
 end motivo
from public.projetos_implantacao_ferramentas project
left join public.empresas company on company.id=project.empresa_id
left join public.responsaveis contact on contact.id=project.responsavel_id
where company.id is null or contact.id is null or contact.empresa_id<>project.empresa_id;

revoke all on public.implantacao_ferramentas_vinculo_pendencias from anon,authenticated;
grant select on public.implantacao_ferramentas_vinculo_pendencias to service_role;

notify pgrst, 'reload schema';
