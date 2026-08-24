-- V66 - Atribuição de campanhas do Diagnóstico Escala Growth.
-- Etapa 1: captura e persistência. Não altera o payload da outbox/Nimble.

create table if not exists public.diagnostico_atribuicoes (
  id uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null unique references public.diagnosticos(id) on delete cascade,
  version smallint not null default 1 check (version = 1),
  first_touch jsonb not null check (jsonb_typeof(first_touch) = 'object'),
  last_touch jsonb not null check (jsonb_typeof(last_touch) = 'object'),
  capture_source text check (capture_source in ('URL_QUERY','COOKIE','LOCAL_STORAGE','MIXED')),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists diagnostico_atribuicoes_received_idx
  on public.diagnostico_atribuicoes(received_at);

alter table public.diagnostico_atribuicoes enable row level security;

comment on table public.diagnostico_atribuicoes is
  'Atribuição first touch e last non-direct touch vinculada 1:1 ao diagnóstico.';
comment on column public.diagnostico_atribuicoes.received_at is
  'Horário confiável do servidor em que a atribuição foi persistida.';

create or replace function public.sanitize_campaign_attribution_touch(input jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  with cleaned as (
    select jsonb_strip_nulls(jsonb_build_object(
      'source',nullif(left(regexp_replace(coalesce(input->>'source',''),'[[:cntrl:]]',' ','g'),64),''),
      'medium',nullif(left(regexp_replace(coalesce(input->>'medium',''),'[[:cntrl:]]',' ','g'),64),''),
      'campaign',nullif(left(regexp_replace(coalesce(input->>'campaign',''),'[[:cntrl:]]',' ','g'),96),''),
      'content',nullif(left(regexp_replace(coalesce(input->>'content',''),'[[:cntrl:]]',' ','g'),160),''),
      'term',nullif(left(regexp_replace(coalesce(input->>'term',''),'[[:cntrl:]]',' ','g'),160),''),
      'campaign_id',nullif(left(regexp_replace(coalesce(input->>'campaign_id',''),'[[:cntrl:]]',' ','g'),96),''),
      'campaign_name',nullif(left(regexp_replace(coalesce(input->>'campaign_name',''),'[[:cntrl:]]',' ','g'),96),''),
      'adset_id',nullif(left(regexp_replace(coalesce(input->>'adset_id',''),'[[:cntrl:]]',' ','g'),96),''),
      'adset_name',nullif(left(regexp_replace(coalesce(input->>'adset_name',''),'[[:cntrl:]]',' ','g'),96),''),
      'ad_id',nullif(left(regexp_replace(coalesce(input->>'ad_id',''),'[[:cntrl:]]',' ','g'),96),''),
      'ad_name',nullif(left(regexp_replace(coalesce(input->>'ad_name',''),'[[:cntrl:]]',' ','g'),96),''),
      'placement',nullif(left(regexp_replace(coalesce(input->>'placement',''),'[[:cntrl:]]',' ','g'),96),''),
      'click_id',nullif(left(regexp_replace(coalesce(input->>'click_id',''),'[[:cntrl:]]',' ','g'),160),''),
      'fbclid',nullif(left(regexp_replace(coalesce(input->>'fbclid',''),'[[:cntrl:]]',' ','g'),160),''),
      'gclid',nullif(left(regexp_replace(coalesce(input->>'gclid',''),'[[:cntrl:]]',' ','g'),160),''),
      'landing_page',nullif(left(regexp_replace(coalesce(input->>'landing_page',''),'[[:cntrl:]]',' ','g'),240),''),
      'referrer',nullif(left(regexp_replace(coalesce(input->>'referrer',''),'[[:cntrl:]]',' ','g'),240),''),
      'captured_at',case when coalesce(input->>'captured_at','') ~ '^\d{4}-\d{2}-\d{2}T' then left(input->>'captured_at',40) end
    )) value
  )
  select case
    when jsonb_typeof(input) <> 'object' then null
    when value ?| array['source','medium','campaign','campaign_id','campaign_name','adset_id','adset_name','ad_id','ad_name','click_id','fbclid','gclid'] then value
    else null
  end
  from cleaned
$$;

revoke all on function public.sanitize_campaign_attribution_touch(jsonb) from public, anon, authenticated;
grant execute on function public.sanitize_campaign_attribution_touch(jsonb) to service_role;

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
begin
  -- A função vigente continua responsável por diagnóstico e outbox.
  -- Como a chamada é aninhada, tudo permanece na mesma transação.
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

  return d;
end
$$;

revoke all on function public.registrar_diagnostico_growth_v2(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_diagnostico_growth_v2(jsonb) to service_role;
