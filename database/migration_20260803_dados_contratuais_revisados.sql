begin;

alter table public.empresas
  add column if not exists dados_contratuais_revisados_em timestamptz;

comment on column public.empresas.dados_contratuais_revisados_em is
  'Indica que os dados contratuais foram revisados manualmente e não devem mais receber preenchimento automático.';

commit;

notify pgrst, 'reload schema';
