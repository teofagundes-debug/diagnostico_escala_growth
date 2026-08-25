-- V67 - Etapa 2 da atribuição de campanhas no evento diagnostico_concluido.
-- Aditiva: redefine somente a RPC V2. Não altera eventos históricos.

create or replace function public.registrar_diagnostico_growth_v2(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  d uuid;
  first_touch jsonb;
  last_touch jsonb;
  source text;
  attribution_snapshot jsonb;
  updated_event_count integer;
begin
  -- A V65 cria diagnóstico e o único evento base V1.
  -- Esta chamada e todas as operações abaixo compartilham a mesma transação.
  d := public.registrar_diagnostico_growth(payload);

  if jsonb_typeof(payload->'atribuicao') = 'object'
     and payload #>> '{atribuicao,version}' = '1' then
    first_touch := public.sanitize_campaign_attribution_touch(payload #> '{atribuicao,first_touch}');
    last_touch := public.sanitize_campaign_attribution_touch(payload #> '{atribuicao,last_touch}');
    first_touch := coalesce(first_touch,last_touch);
    last_touch := coalesce(last_touch,first_touch);
    source := case
      when payload->>'attribution_capture_source' in ('URL_QUERY','COOKIE','LOCAL_STORAGE','MIXED')
        then payload->>'attribution_capture_source'
      else 'MIXED'
    end;

    if first_touch is not null and last_touch is not null then
      insert into public.diagnostico_atribuicoes(
        diagnostico_id,version,first_touch,last_touch,capture_source,received_at
      ) values (d,1,first_touch,last_touch,source,clock_timestamp())
      on conflict(diagnostico_id) do nothing;
    end if;
  end if;

  -- O webhook usa exclusivamente o snapshot já persistido pela Etapa 1.
  select jsonb_build_object(
    'version',attribution.version,
    'first_touch',attribution.first_touch,
    'last_touch',attribution.last_touch,
    'received_at',attribution.received_at
  )
  into attribution_snapshot
  from public.diagnostico_atribuicoes attribution
  where attribution.diagnostico_id = d;

  -- Atualiza o mesmo evento canônico; não cria uma segunda linha de outbox.
  update public.integration_events event
  set event_version = 2,
      payload = jsonb_set(
        jsonb_set(event.payload,'{event_version}','2'::jsonb,true),
        '{atribuicao}',coalesce(attribution_snapshot,'null'::jsonb),true
      )
  where event.idempotency_key = 'diagnostico_concluido:'||d
    and event.aggregate_type = 'diagnostico'
    and event.aggregate_id = d
    and event.event_type = 'diagnostico_concluido'
    and event.status = 'PENDING';

  get diagnostics updated_event_count = row_count;
  if updated_event_count <> 1 then
    raise exception 'Evento canônico do diagnóstico % não pôde ser congelado na versão 2.',d;
  end if;

  return d;
end
$$;

revoke all on function public.registrar_diagnostico_growth_v2(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_diagnostico_growth_v2(jsonb) to service_role;
