-- Migração v17 — acesso seguro do cliente
alter table public.portal_usuarios add column if not exists nome text;
alter table public.portal_usuarios add column if not exists telefone text;
alter table public.portal_usuarios add column if not exists status_acesso text default 'Não criado';
alter table public.portal_usuarios add column if not exists convite_enviado_em timestamptz;
alter table public.portal_usuarios add column if not exists convite_expira_em timestamptz;
alter table public.portal_usuarios add column if not exists convite_reenviado_em timestamptz;
alter table public.portal_usuarios add column if not exists primeiro_acesso_em timestamptz;
alter table public.portal_usuarios add column if not exists ultimo_acesso_em timestamptz;
alter table public.portal_usuarios add column if not exists acesso_ativado_em timestamptz;
alter table public.portal_usuarios add column if not exists convite_link text;
create index if not exists portal_usuarios_empresa_perfil_idx on public.portal_usuarios(empresa_id,perfil);

-- O acesso de cliente é sempre limitado à empresa vinculada.
drop policy if exists "cliente le proprio perfil" on public.portal_usuarios;
create policy "cliente le proprio perfil" on public.portal_usuarios for select to authenticated
using (auth.uid()=auth_user_id);

drop policy if exists "cliente le propria empresa" on public.empresas;
create policy "cliente le propria empresa" on public.empresas for select to authenticated
using (id in (select empresa_id from public.portal_usuarios where auth_user_id=auth.uid() and ativo=true));

