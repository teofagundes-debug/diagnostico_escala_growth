-- Correção cirúrgica da persistência dos valores da medição de evolução.
-- Mantém a assinatura existente e aceita o novo contrato explícito em array,
-- preservando compatibilidade com o objeto utilizado originalmente pela V56.
create or replace function public.create_strategic_evolution_measurement(
 p_implementation_id uuid,p_measured_at date,p_values jsonb,p_general_note text default null,p_actor text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare imp public.strategic_plan_implementations%rowtype; diag public.diagnosticos%rowtype; measurement_id uuid; baseline jsonb; pillar record; indicator_code text; current_json jsonb;
begin
 select * into imp from public.strategic_plan_implementations where id=p_implementation_id;
 if imp.id is null then raise exception using errcode='P0002',message='Implantação não localizada.'; end if;
 select * into diag from public.diagnosticos where id=imp.diagnostico_id;
 if diag.id is null then raise exception using errcode='P0002',message='Diagnóstico de origem não localizado.'; end if;
 baseline=jsonb_build_object('IEG',jsonb_build_object('label','Índice Escala Growth','value',diag.pontuacao_geral));
 for pillar in select pilar,percentual from public.resultados_pilares where diagnostico_id=diag.id order by pilar loop
  indicator_code='PILAR:'||pillar.pilar;
  baseline=baseline||jsonb_build_object(indicator_code,jsonb_build_object('label',pillar.pilar,'value',pillar.percentual));
 end loop;
 insert into public.strategic_evolution_measurements(empresa_id,diagnostic_id,plan_id,plan_version,implementation_id,measured_at,consultant,general_note,baseline_snapshot,created_by)
 values(imp.empresa_id,imp.diagnostico_id,imp.plan_id,imp.plan_version,imp.id,p_measured_at,p_actor,p_general_note,baseline,p_actor) returning id into measurement_id;
 for indicator_code in select jsonb_object_keys(baseline) loop
  if jsonb_typeof(coalesce(p_values,'{}'::jsonb))='array' then
   select entry.value->'value' into current_json from jsonb_array_elements(p_values) as entry(value) where entry.value->>'indicator_code'=indicator_code limit 1;
  else
   current_json=p_values->indicator_code;
  end if;
  insert into public.strategic_evolution_measurement_items(measurement_id,indicator_key,indicator_label,baseline_value,current_value)
  values(measurement_id,indicator_code,baseline->indicator_code->>'label',(baseline->indicator_code->>'value')::numeric,
   case when current_json is null or current_json='null'::jsonb or trim(current_json#>>'{}')='' then null else (current_json#>>'{}')::numeric end);
 end loop;
 return measurement_id;
end $$;

revoke all on function public.create_strategic_evolution_measurement(uuid,date,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.create_strategic_evolution_measurement(uuid,date,jsonb,text,text) to service_role;
