begin;

create table if not exists public.metodo_growth_versoes (
  id uuid primary key default gen_random_uuid(),
  versao text not null unique,
  nome text not null default 'Método Escala Growth',
  novidades jsonb not null default '[]'::jsonb,
  atual boolean not null default false,
  publicada_em timestamptz not null default now(),
  publicada_por text not null default 'Usuário Master'
);

update public.metodo_growth_versoes set atual=false where atual=true;
insert into public.metodo_growth_versoes(versao,nome,novidades,atual,publicada_por)
values('2.4','Método Escala Growth','["Estrutura Base Obrigatória","Novo Motor de Crescimento","Recomendações Estratégicas","Cronograma atualizado","Biblioteca de Soluções","Pendências Inteligentes"]'::jsonb,true,'Usuário Master')
on conflict(versao) do update set novidades=excluded.novidades,atual=true,publicada_em=now(),publicada_por=excluded.publicada_por;

alter table public.planos_estrategicos
  add column if not exists metodo_nome text,
  add column if not exists metodo_versao text,
  add column if not exists metodo_aplicado_em timestamptz;

update public.planos_estrategicos
set metodo_nome=coalesce(metodo_nome,'Método Escala Growth'),
    metodo_versao=coalesce(metodo_versao,'2.3'),
    metodo_aplicado_em=coalesce(metodo_aplicado_em,created_at,now())
where metodo_nome is null or metodo_versao is null or metodo_aplicado_em is null;

alter table public.regeneracoes_metodo
  add column if not exists versao_metodo_anterior text,
  add column if not exists versao_metodo_nova text;

create or replace function public.aplicar_versao_atual_metodo_growth()
returns trigger language plpgsql security definer set search_path=public as $$
declare atual public.metodo_growth_versoes%rowtype;
begin
  if new.metodo_versao is null then
    select * into atual from public.metodo_growth_versoes where metodo_growth_versoes.atual=true order by publicada_em desc limit 1;
    new.metodo_nome:=coalesce(new.metodo_nome,atual.nome,'Método Escala Growth');
    new.metodo_versao:=coalesce(atual.versao,'2.4');
    new.metodo_aplicado_em:=coalesce(new.metodo_aplicado_em,now());
  end if;
  return new;
end $$;

drop trigger if exists planos_estrategicos_versao_metodo on public.planos_estrategicos;
create trigger planos_estrategicos_versao_metodo before insert on public.planos_estrategicos
for each row execute function public.aplicar_versao_atual_metodo_growth();

alter table public.metodo_growth_versoes enable row level security;
drop policy if exists "Service role gerencia versões do método" on public.metodo_growth_versoes;
create policy "Service role gerencia versões do método" on public.metodo_growth_versoes for all to service_role using(true) with check(true);
drop policy if exists "Master consulta versões do método" on public.metodo_growth_versoes;
create policy "Master consulta versões do método" on public.metodo_growth_versoes for select to authenticated
using(exists(select 1 from public.portal_usuarios pu where pu.auth_user_id=auth.uid() and pu.ativo and pu.perfil='master'));

commit;
