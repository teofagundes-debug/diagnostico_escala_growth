-- V73 — Arquivamento operacional de empresas e preservação documental.
-- Migration estritamente aditiva: não remove nem reassocia registros históricos.

alter table public.empresas add column if not exists arquivada_em timestamptz;
alter table public.empresas add column if not exists arquivada_por text;
alter table public.empresas add column if not exists motivo_arquivamento text;

alter table public.formalizacoes add column if not exists arquivada_em timestamptz;
alter table public.formalizacoes add column if not exists arquivada_por text;
alter table public.formalizacoes add column if not exists motivo_arquivamento text;

create index if not exists empresas_ativas_idx
  on public.empresas(created_at desc) where arquivada_em is null;
create index if not exists formalizacoes_arquivadas_idx
  on public.formalizacoes(arquivada_em desc) where status='ARQUIVADA';

-- O cliente só pode resolver formalizações de uma empresa operacionalmente ativa.
drop policy if exists "Portal consulta formalizacoes da empresa" on public.formalizacoes;
create policy "Portal consulta formalizacoes da empresa" on public.formalizacoes
 for select to authenticated using(
   status<>'ARQUIVADA'
   and exists(
     select 1
     from public.portal_usuarios pu
     join public.empresas e on e.id=pu.empresa_id
     where pu.auth_user_id=auth.uid()
       and pu.ativo=true
       and pu.empresa_id=formalizacoes.empresa_id
       and e.arquivada_em is null
   )
 );

comment on column public.empresas.arquivada_em is 'Retira a empresa da operação ativa sem destruir sua identidade documental.';
comment on column public.formalizacoes.arquivada_em is 'Data em que a formalização se tornou histórica e somente leitura.';

create or replace function public.arquivar_empresa_com_historico(
  p_empresa_id uuid,
  p_usuario_id uuid,
  p_usuario_email text
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_empresa public.empresas%rowtype;
  v_now timestamptz:=now();
  v_counts jsonb;
begin
  select * into v_empresa from public.empresas where id=p_empresa_id for update;
  if not found then raise exception 'Empresa não encontrada.'; end if;
  if v_empresa.arquivada_em is not null then raise exception 'Empresa já arquivada.'; end if;

  select jsonb_build_object(
    'formalizacoes',(select count(*) from public.formalizacoes where empresa_id=p_empresa_id),
    'propostas',(select count(*) from public.proposta_publicacoes where empresa_id=p_empresa_id),
    'financeiros',(select count(*) from public.financeiro_growth where empresa_id=p_empresa_id),
    'contratos',(select count(*) from public.contratos_growth where empresa_id=p_empresa_id),
    'aceites',(select count(*) from public.aceites_growth where empresa_id=p_empresa_id),
    'pagamentos',(select count(*) from public.pagamentos_growth where empresa_id=p_empresa_id)
  ) into v_counts;

  update public.formalizacoes set
    status='ARQUIVADA',arquivada_em=v_now,arquivada_por=p_usuario_email,
    motivo_arquivamento='EMPRESA_EXCLUIDA',updated_at=v_now
  where empresa_id=p_empresa_id;

  update public.portal_usuarios set ativo=false,updated_at=v_now where empresa_id=p_empresa_id;

  update public.empresas set
    arquivada_em=v_now,arquivada_por=p_usuario_email,
    motivo_arquivamento='EMPRESA_EXCLUIDA',updated_at=v_now
  where id=p_empresa_id;

  insert into public.exclusoes_empresas_log(
    empresa_id_excluida,empresa_nome,usuario_id,usuario_email,
    registros_removidos,arquivos_removidos,usuarios_auth_removidos
  ) values(
    p_empresa_id,v_empresa.nome,p_usuario_id,p_usuario_email,
    jsonb_build_object('empresa',0,'arquivados',v_counts),0,0
  );

  return jsonb_build_object('empresa_id',p_empresa_id,'arquivada_em',v_now,'arquivados',v_counts);
end;
$$;

revoke all on function public.arquivar_empresa_com_historico(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.arquivar_empresa_com_historico(uuid,uuid,text) to service_role;
notify pgrst, 'reload schema';
