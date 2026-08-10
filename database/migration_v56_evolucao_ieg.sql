-- Sprint 11 — Evolução do IEG
create table if not exists public.strategic_evolution_measurements (
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null references public.empresas(id) on delete cascade,
 diagnostic_id uuid not null references public.diagnosticos(id) on delete restrict,
 plan_id uuid not null references public.strategic_execution_plans(id) on delete restrict,
 plan_version integer not null,
 implementation_id uuid not null references public.strategic_plan_implementations(id) on delete restrict,
 measured_at date not null,
 consultant text,
 general_note text,
 baseline_snapshot jsonb not null,
 created_by text,
 created_at timestamptz not null default now()
);

create table if not exists public.strategic_evolution_measurement_items (
 id uuid primary key default gen_random_uuid(),
 measurement_id uuid not null references public.strategic_evolution_measurements(id) on delete cascade,
 indicator_key text not null,
 indicator_label text not null,
 baseline_value numeric,
 current_value numeric,
 created_at timestamptz not null default now(),
 unique(measurement_id,indicator_key)
);

create index if not exists strategic_evolution_implementation_idx on public.strategic_evolution_measurements(implementation_id,measured_at,created_at);
create index if not exists strategic_evolution_items_idx on public.strategic_evolution_measurement_items(measurement_id,indicator_key);
alter table public.strategic_evolution_measurements enable row level security;
alter table public.strategic_evolution_measurement_items enable row level security;
drop policy if exists "Service role gerencia medições de evolução" on public.strategic_evolution_measurements;
drop policy if exists "Service role gerencia itens de evolução" on public.strategic_evolution_measurement_items;
create policy "Service role gerencia medições de evolução" on public.strategic_evolution_measurements for all to service_role using(true) with check(true);
create policy "Service role gerencia itens de evolução" on public.strategic_evolution_measurement_items for all to service_role using(true) with check(true);

create or replace function public.prevent_strategic_evolution_measurement_update() returns trigger language plpgsql as $$
begin raise exception using errcode='P0001',message='Medições históricas de evolução são imutáveis.'; end $$;
drop trigger if exists strategic_evolution_measurement_immutable on public.strategic_evolution_measurements;
create trigger strategic_evolution_measurement_immutable before update on public.strategic_evolution_measurements for each row execute function public.prevent_strategic_evolution_measurement_update();
drop trigger if exists strategic_evolution_item_immutable on public.strategic_evolution_measurement_items;
create trigger strategic_evolution_item_immutable before update on public.strategic_evolution_measurement_items for each row execute function public.prevent_strategic_evolution_measurement_update();

comment on table public.strategic_evolution_measurements is 'Fotografias históricas imutáveis da evolução observada durante a Implantação.';

create or replace function public.create_strategic_evolution_measurement(
 p_implementation_id uuid,p_measured_at date,p_values jsonb,p_general_note text default null,p_actor text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare imp public.strategic_plan_implementations%rowtype; diag public.diagnosticos%rowtype; measurement_id uuid; baseline jsonb; pillar record; key text; current_text text;
begin
 select * into imp from public.strategic_plan_implementations where id=p_implementation_id;
 if imp.id is null then raise exception using errcode='P0002',message='Implantação não localizada.'; end if;
 select * into diag from public.diagnosticos where id=imp.diagnostico_id;
 if diag.id is null then raise exception using errcode='P0002',message='Diagnóstico de origem não localizado.'; end if;
 baseline=jsonb_build_object('IEG',jsonb_build_object('label','Índice Escala Growth','value',diag.pontuacao_geral));
 for pillar in select pilar,percentual from public.resultados_pilares where diagnostico_id=diag.id order by pilar loop
  key='PILAR:'||pillar.pilar;
  baseline=baseline||jsonb_build_object(key,jsonb_build_object('label',pillar.pilar,'value',pillar.percentual));
 end loop;
 insert into public.strategic_evolution_measurements(empresa_id,diagnostic_id,plan_id,plan_version,implementation_id,measured_at,consultant,general_note,baseline_snapshot,created_by)
 values(imp.empresa_id,imp.diagnostico_id,imp.plan_id,imp.plan_version,imp.id,p_measured_at,p_actor,p_general_note,baseline,p_actor) returning id into measurement_id;
 for key in select jsonb_object_keys(baseline) loop
  current_text=p_values->>key;
  insert into public.strategic_evolution_measurement_items(measurement_id,indicator_key,indicator_label,baseline_value,current_value)
  values(measurement_id,key,baseline->key->>'label',(baseline->key->>'value')::numeric,case when current_text is null or trim(current_text)='' then null else current_text::numeric end);
 end loop;
 return measurement_id;
end $$;

revoke all on function public.create_strategic_evolution_measurement(uuid,date,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.create_strategic_evolution_measurement(uuid,date,jsonb,text,text) to service_role;
