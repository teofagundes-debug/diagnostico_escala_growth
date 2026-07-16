-- Fase 1: somente Usuário Master e Cliente.
update public.portal_usuarios set perfil='master' where perfil='consultor';
alter table public.portal_usuarios drop constraint if exists portal_usuarios_perfil_check;
alter table public.portal_usuarios add constraint portal_usuarios_perfil_check check(perfil in ('master','cliente'));
comment on column public.portal_usuarios.perfil is 'Fase 1 limitada a master e cliente; arquitetura preparada para expansão futura quando houver necessidade operacional real.';

