begin;

create or replace function public.registrar_situacao_comercial(p_empresa_id uuid, p_dados jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  anterior public.situacoes_comerciais_versoes%rowtype;
  nova_id uuid;
  nova_versao integer;
  inicial boolean;
  inicio date;
begin
  perform pg_advisory_xact_lock(hashtext(p_empresa_id::text));
  select * into anterior from public.situacoes_comerciais_versoes
    where empresa_id=p_empresa_id and vigente=true order by versao desc limit 1 for update;
  select coalesce(max(versao),0)+1 into nova_versao from public.situacoes_comerciais_versoes where empresa_id=p_empresa_id;
  inicial := nova_versao=1;
  if not inicial and nullif(trim(p_dados->>'motivo_alteracao'),'') is null then
    raise exception 'Informe o motivo da alteração.' using errcode='22023';
  end if;
  inicio := coalesce(nullif(p_dados->>'contrato_inicio','')::date, anterior.contrato_inicio, current_date);
  if anterior.id is not null then update public.situacoes_comerciais_versoes set vigente=false where id=anterior.id; end if;
  insert into public.situacoes_comerciais_versoes(
    empresa_id,versao,vigente,mensalidade,forma_pagamento,status_pagamento,contrato_status,
    contrato_inicio,prazo_meses,renovacao_em,recursos,responsavel,observacoes,motivo_alteracao,origem,snapshot
  ) values (
    p_empresa_id,nova_versao,true,greatest(0,coalesce((p_dados->>'mensalidade')::numeric,0)),
    coalesce(nullif(p_dados->>'forma_pagamento',''),'Cartão recorrente'),
    coalesce(nullif(p_dados->>'status_pagamento',''),'Ativo'),coalesce(nullif(p_dados->>'contrato_status',''),'Ativo'),
    inicio,12,(inicio+interval '1 year')::date,coalesce(p_dados->'recursos','[]'::jsonb),
    coalesce(nullif(p_dados->>'responsavel',''),'Usuário Master'),nullif(p_dados->>'observacoes',''),
    case when inicial then 'Cadastro inicial' else p_dados->>'motivo_alteracao' end,
    case when inicial then 'Situação Comercial Inicial' else 'Edição Administrativa' end,
    jsonb_build_object('anterior',to_jsonb(anterior),'registrado_por',coalesce(p_dados->>'responsavel','Usuário Master'))
  ) returning id into nova_id;
  return nova_id;
end;
$$;

revoke all on function public.registrar_situacao_comercial(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.registrar_situacao_comercial(uuid,jsonb) to service_role;
commit;
