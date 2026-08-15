-- V64 - Criação atômica do DRAFT derivado de Revisão Estratégica.
-- Aditiva: não altera V11, planos publicados, snapshots ou ações históricas.
create or replace function public.create_strategic_revision_draft(
  p_plan jsonb,
  p_actions jsonb,
  p_history jsonb,
  p_meeting_id uuid,
  p_meeting_update jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.strategic_execution_plans;
begin
  insert into public.strategic_execution_plans(
    id,empresa_id,diagnostico_id,version_number,status,strategic_direction,
    primary_priority,acquisition_movement,action_plan_source_version,feature_version,
    general_consultant_notes,consultant,revisao_estrategica_id,contextual_prescriptions,
    contextual_prescription_version,strategic_context_snapshot,strategic_action_plan_snapshot
  ) values (
    (p_plan->>'id')::uuid,(p_plan->>'empresa_id')::uuid,(p_plan->>'diagnostico_id')::uuid,
    (p_plan->>'version_number')::integer,p_plan->>'status',p_plan->>'strategic_direction',
    p_plan->>'primary_priority',p_plan->>'acquisition_movement',p_plan->>'action_plan_source_version',
    p_plan->>'feature_version',nullif(p_plan->>'general_consultant_notes',''),p_plan->>'consultant',
    (p_plan->>'revisao_estrategica_id')::uuid,coalesce(p_plan->'contextual_prescriptions','[]'::jsonb),
    p_plan->>'contextual_prescription_version',p_plan->'strategic_context_snapshot',
    p_plan->'strategic_action_plan_snapshot'
  ) returning * into v_plan;

  insert into public.strategic_execution_plan_actions(
    id,plan_id,source_type,action_origin,source_action_code,contextual_action_key,
    recommended_snapshot,strategic_dimension,agreed_title,agreed_objective,agreed_indicator,
    agreed_target,responsible,due_date,agreed_horizon,status,consultant_notes,
    strategic_change_reason,start_condition,completed_at
  )
  select
    coalesce(x.id,gen_random_uuid()),v_plan.id,x.source_type,x.action_origin,x.source_action_code,
    x.contextual_action_key,x.recommended_snapshot,x.strategic_dimension,x.agreed_title,
    x.agreed_objective,x.agreed_indicator,x.agreed_target,x.responsible,x.due_date,
    x.agreed_horizon,x.status,x.consultant_notes,x.strategic_change_reason,x.start_condition,x.completed_at
  from jsonb_to_recordset(coalesce(p_actions,'[]'::jsonb)) as x(
    id uuid,source_type text,action_origin text,source_action_code text,contextual_action_key text,
    recommended_snapshot jsonb,strategic_dimension text,agreed_title text,agreed_objective text,
    agreed_indicator text,agreed_target text,responsible text,due_date date,agreed_horizon text,
    status text,consultant_notes text,strategic_change_reason text,start_condition text,completed_at timestamptz
  );

  insert into public.strategic_execution_plan_history(plan_id,event_type,description,actor,metadata)
  values(v_plan.id,p_history->>'event_type',p_history->>'description',p_history->>'actor',coalesce(p_history->'metadata','{}'::jsonb));

  update public.reunioes_estrategicas set
    status='Realizada',
    etapa_atual='Revisão concluída',
    prontidao_percentual=100,
    dados_reuniao=coalesce(p_meeting_update->'dados_reuniao',dados_reuniao),
    consultant_initial_hypothesis=nullif(p_meeting_update->>'consultant_initial_hypothesis',''),
    prepared_specific_questions=nullif(p_meeting_update->>'prepared_specific_questions',''),
    consultant_notes=nullif(p_meeting_update->>'consultant_notes',''),
    realizada_em=(p_meeting_update->>'realizada_em')::timestamptz,
    observacoes=nullif(p_meeting_update->>'observacoes',''),
    consultor=p_meeting_update->>'consultor',
    updated_at=(p_meeting_update->>'updated_at')::timestamptz
  where id=p_meeting_id;

  if not found then raise exception 'Revisão Estratégica não encontrada: %',p_meeting_id; end if;
  return to_jsonb(v_plan);
end;
$$;

revoke all on function public.create_strategic_revision_draft(jsonb,jsonb,jsonb,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_strategic_revision_draft(jsonb,jsonb,jsonb,uuid,jsonb) to service_role;
comment on function public.create_strategic_revision_draft(jsonb,jsonb,jsonb,uuid,jsonb) is
  'Cria DRAFT, decisões acordadas, histórico e conclui a revisão em uma única transação.';
notify pgrst, 'reload schema';
