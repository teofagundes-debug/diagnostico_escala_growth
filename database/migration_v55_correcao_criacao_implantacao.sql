-- Corrige a rastreabilidade das ações ao criar a Implantação.
-- A publicação recria as linhas de ações; por isso, o UUID armazenado no
-- snapshot pode ser histórico. O conteúdo continua vindo do snapshot imutável.

create or replace function public.create_strategic_plan_implementation(p_plan_id uuid,p_actor text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare
 p public.strategic_execution_plans%rowtype;
 implementation_id uuid;
 action jsonb;
 actions jsonb;
 action_id uuid;
 due_date date;
begin
 select * into p from public.strategic_execution_plans where id=p_plan_id for update;
 if p.id is null then raise exception using errcode='P0002',message='Plano Estratégico Executável não localizado.'; end if;
 if p.status not in ('PUBLISHED','SUPERSEDED') then raise exception using errcode='P0001',message='Somente uma versão publicada pode gerar uma Implantação.'; end if;
 if p.published_snapshot is null then raise exception using errcode='P0001',message='O snapshot publicado não está disponível.'; end if;
 actions:=p.published_snapshot->'actions';
 if actions is null or jsonb_typeof(actions)<>'array' or jsonb_array_length(actions)=0 then raise exception using errcode='P0001',message='A versão publicada não possui ações acordadas.'; end if;
 select id into implementation_id from public.strategic_plan_implementations where plan_id=p.id and plan_version=p.version_number;
 if implementation_id is not null then return implementation_id; end if;
 insert into public.strategic_plan_implementations(empresa_id,diagnostico_id,plan_id,plan_version,strategic_direction,source_snapshot,created_by)
 values(p.empresa_id,p.diagnostico_id,p.id,p.version_number,p.strategic_direction,p.published_snapshot,p_actor) returning id into implementation_id;
 for action in select value from jsonb_array_elements(actions)
 loop
  select current_action.id into action_id
  from public.strategic_execution_plan_actions current_action
  where current_action.plan_id=p.id and (
   (nullif(action->>'source_action_code','') is not null and current_action.source_action_code=action->>'source_action_code')
   or
   (nullif(action->>'source_action_code','') is null and current_action.source_type='CONSULTANT' and current_action.agreed_title=coalesce(action->>'agreed_title','') and current_action.agreed_horizon=coalesce(nullif(action->>'agreed_horizon',''),'AGORA'))
  )
  order by current_action.created_at desc limit 1;
  due_date:=case when coalesce(action->>'due_date','')~'^\d{4}-\d{2}-\d{2}$' then (action->>'due_date')::date else null end;
  insert into public.strategic_plan_implementation_items(implementation_id,origin_action_id,source_type,source_action_code,agreed_title,agreed_objective,dimension,agreed_indicator,agreed_target,agreed_responsible,agreed_due_date,agreed_horizon,consultant_notes,origin_snapshot,operational_responsible,operational_due_date)
  values(implementation_id,action_id,coalesce(action->>'source_type','CONSULTANT'),nullif(action->>'source_action_code',''),coalesce(action->>'agreed_title','Ação acordada'),nullif(action->>'agreed_objective',''),nullif(action->'recommended'->>'dimension',''),nullif(action->>'agreed_indicator',''),nullif(action->>'agreed_target',''),nullif(action->>'responsible',''),due_date,coalesce(nullif(action->>'agreed_horizon',''),'AGORA'),nullif(action->>'consultant_notes',''),action,nullif(action->>'responsible',''),due_date);
 end loop;
 insert into public.strategic_plan_implementation_history(implementation_id,event_type,description,actor,metadata)
 values(implementation_id,'IMPLEMENTATION_CREATED','Implantação criada a partir do Plano Estratégico Executável publicado.',p_actor,jsonb_build_object('plan_id',p.id,'plan_version',p.version_number));
 return implementation_id;
exception when unique_violation then
 select id into implementation_id from public.strategic_plan_implementations where plan_id=p_plan_id and plan_version=p.version_number;
 return implementation_id;
end $$;

revoke all on function public.create_strategic_plan_implementation(uuid,text) from public,anon,authenticated;
grant execute on function public.create_strategic_plan_implementation(uuid,text) to service_role;
