-- V74 — cadastro canônico e outbox Nimble para solicitações de Ferramentas.
-- Aditiva: não cria Diagnóstico Growth e não altera eventos ou projetos históricos.

create or replace function public.claim_integration_events(p_limit integer default 10)
returns setof public.integration_events
language plpgsql security definer set search_path=public as $$
begin
 return query
 with eligible as (
  select id from public.integration_events
  where event_type in ('diagnostico_concluido','solicitacao_ferramentas_concluida')
    and ((status='PENDING' and next_attempt_at<=now()) or (status='PROCESSING' and locked_at<now()-interval '5 minutes'))
  order by created_at for update skip locked
  limit greatest(1,least(coalesce(p_limit,10),50))
 )
 update public.integration_events event set status='PROCESSING',locked_at=now()
 from eligible where event.id=eligible.id returning event.*;
end $$;

revoke all on function public.claim_integration_events(integer) from public,anon,authenticated;
grant execute on function public.claim_integration_events(integer) to service_role;

create or replace function public.registrar_diagnostico_implantacao(payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare
 e uuid; r uuid; p uuid; proposal uuid;
 normalized_email text:=lower(trim(coalesce(payload->>'email','')));
 normalized_phone text:=regexp_replace(coalesce(payload->>'whatsapp',''),'[^0-9]','','g');
 email_company_count integer:=0; phone_company_count integer:=0; intersection_company_count integer:=0;
 ambiguous boolean:=false; criterion text;
 event_id uuid:=gen_random_uuid(); event_created_at timestamptz:=clock_timestamp(); event_payload jsonb;
begin
 select count(distinct contact.empresa_id),min(contact.empresa_id::text)::uuid into intersection_company_count,e
 from public.responsaveis contact
 where normalized_email<>'' and normalized_phone<>'' and lower(trim(contact.email))=normalized_email
   and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone;

 if intersection_company_count=1 then criterion:='EMAIL_E_WHATSAPP_EXATOS';
 else
  e:=null;
  select count(distinct contact.empresa_id),min(contact.empresa_id::text)::uuid into email_company_count,e
  from public.responsaveis contact where normalized_email<>'' and lower(trim(contact.email))=normalized_email;
  if email_company_count=1 then criterion:='EMAIL_EXATO';
  else
   e:=null;
   select count(distinct contact.empresa_id),min(contact.empresa_id::text)::uuid into phone_company_count,e
   from public.responsaveis contact where normalized_phone<>'' and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone;
   if phone_company_count=1 then criterion:='WHATSAPP_EXATO'; else e:=null; end if;
  end if;
 end if;

 ambiguous:=intersection_company_count>1 or email_company_count>1 or phone_company_count>1;
 if e is null then
  insert into public.empresas(nome,razao_social,nome_fantasia,cpf_cnpj,segmento,endereco,cidade,estado,cep)
  values(trim(payload->>'empresa'),trim(payload->>'empresa'),nullif(trim(payload->>'nome_fantasia'),''),
   regexp_replace(coalesce(payload->>'cpf_cnpj',''),'[^0-9]','','g'),nullif(trim(payload->>'segmento'),''),
   trim(payload->>'endereco'),trim(payload->>'cidade'),trim(payload->>'estado'),regexp_replace(coalesce(payload->>'cep',''),'[^0-9]','','g'))
  returning id into e;
  criterion:=case when ambiguous then 'NOVA_EMPRESA_POR_AMBIGUIDADE' else 'NOVA_EMPRESA_SEM_CORRESPONDENCIA_SEGURA' end;
 else
  update public.empresas set
   razao_social=coalesce(nullif(trim(payload->>'empresa'),''),razao_social),
   nome_fantasia=coalesce(nullif(trim(payload->>'nome_fantasia'),''),nome_fantasia),
   cpf_cnpj=coalesce(nullif(regexp_replace(coalesce(payload->>'cpf_cnpj',''),'[^0-9]','','g'),''),cpf_cnpj),
   segmento=coalesce(nullif(trim(payload->>'segmento'),''),segmento),
   endereco=coalesce(nullif(trim(payload->>'endereco'),''),endereco),cidade=coalesce(nullif(trim(payload->>'cidade'),''),cidade),
   estado=coalesce(nullif(trim(payload->>'estado'),''),estado),cep=coalesce(nullif(regexp_replace(coalesce(payload->>'cep',''),'[^0-9]','','g'),''),cep),updated_at=now()
  where id=e;
 end if;

 select contact.id into r from public.responsaveis contact where contact.empresa_id=e and (
  (normalized_email<>'' and lower(trim(contact.email))=normalized_email) or
  (normalized_phone<>'' and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone))
 order by (lower(trim(contact.email))=normalized_email and regexp_replace(coalesce(contact.telefone,''),'[^0-9]','','g')=normalized_phone) desc,contact.created_at,contact.id limit 1;
 if r is null then insert into public.responsaveis(empresa_id,nome,email,telefone) values(e,trim(payload->>'nome'),normalized_email,normalized_phone) returning id into r;
 else update public.responsaveis set nome=trim(payload->>'nome'),email=normalized_email,telefone=normalized_phone where id=r and empresa_id=e; end if;

 insert into public.projetos_implantacao_ferramentas(empresa_id,responsavel_id,area_interesse,solucoes_selecionadas,respostas_questionario,configuracao_sugerida,itens_validacao,sintese_necessidade,empresa_vinculo_criterio,empresa_vinculo_ambiguidade)
 values(e,r,payload->>'area_interesse',coalesce(payload->'solucoes_selecionadas','[]'::jsonb),coalesce(payload->'respostas','{}'::jsonb),coalesce(payload->'configuracao_sugerida','{}'::jsonb),coalesce(payload->'itens_validacao','[]'::jsonb),payload->>'sintese',criterion,ambiguous) returning id into p;
 insert into public.pre_propostas_implantacao(projeto_id,sintese,configuracao,itens_implantacao)
 values(p,payload->>'sintese',coalesce(payload->'configuracao_sugerida','{}'::jsonb),coalesce(payload->'itens_implantacao','[]'::jsonb)) returning id into proposal;
 insert into public.pre_propostas_implantacao_historico(projeto_id,pre_proposta_id,evento,descricao,metadata)
 values(p,proposal,'QUESTIONARIO_CONCLUIDO','Questionário de Implantação concluído e pré-proposta interna criada.',jsonb_build_object('origem','DIAGNOSTICO_IMPLANTACAO','empresa_id',e,'responsavel_id',r,'vinculo_criterio',criterion,'ambiguidade',ambiguous));

 event_payload:=jsonb_build_object(
  'event_id',event_id,'event_type','solicitacao_ferramentas_concluida','event_version',1,'occurred_at',event_created_at,
  'idempotency_key','solicitacao_ferramentas_concluida:'||p,
  'contato',jsonb_build_object('nome',trim(payload->>'nome'),'email',normalized_email,'whatsapp',normalized_phone),
  'empresa',jsonb_build_object('id',e,'nome',trim(payload->>'empresa'),'nome_fantasia',coalesce(payload->>'nome_fantasia',''),'cnpj',regexp_replace(coalesce(payload->>'cpf_cnpj',''),'[^0-9]','','g'),'segmento',coalesce(payload->>'segmento',''),'endereco',trim(payload->>'endereco'),'cidade',trim(payload->>'cidade'),'estado',trim(payload->>'estado'),'cep',regexp_replace(coalesce(payload->>'cep',''),'[^0-9]','','g')),
  'solicitacao',jsonb_build_object('id',p,'area_interesse',payload->>'area_interesse','solucoes',coalesce(payload->'solucoes_selecionadas','[]'::jsonb),'respostas',coalesce(payload->'respostas','{}'::jsonb),'sintese',coalesce(payload->>'sintese','')),
  'nimble_intent',jsonb_build_object('tag','solicitacao_ferramentas','target_stage','Solicitação de Ferramentas','create_contact_if_missing',true,'create_deal_if_missing',true));
 insert into public.integration_events(id,event_type,event_version,aggregate_type,aggregate_id,company_id,payload,idempotency_key,status,next_attempt_at,created_at)
 values(event_id,'solicitacao_ferramentas_concluida',1,'projeto_implantacao_ferramentas',p,e,event_payload,'solicitacao_ferramentas_concluida:'||p,'PENDING',event_created_at,event_created_at)
 on conflict(idempotency_key) do nothing;
 return p;
end $$;

revoke all on function public.registrar_diagnostico_implantacao(jsonb) from public,anon,authenticated;
grant execute on function public.registrar_diagnostico_implantacao(jsonb) to service_role;
notify pgrst,'reload schema';
