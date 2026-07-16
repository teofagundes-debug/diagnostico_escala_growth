-- Fase 1: somente Usuário Master e Cliente.
update public.portal_usuarios set perfil='master' where perfil='consultor';
alter table public.portal_usuarios drop constraint if exists portal_usuarios_perfil_check;
alter table public.portal_usuarios add constraint portal_usuarios_perfil_check check(perfil in ('master','cliente'));
comment on column public.portal_usuarios.perfil is 'Fase 1 limitada a master e cliente; arquitetura preparada para expansão futura quando houver necessidade operacional real.';


-- Converte com seguran?a administradores legados criados pelo setup oficial.
insert into public.portal_usuarios(auth_user_id,email,empresa_id,perfil,ativo)
select id,lower(email),null,'master',true
from auth.users
where lower(coalesce(raw_app_meta_data->>'role','')) in ('master','admin')
   or lower(coalesce(raw_user_meta_data->>'role',''))='admin'
on conflict(email) do update set auth_user_id=excluded.auth_user_id,empresa_id=null,perfil='master',ativo=true,updated_at=now();
