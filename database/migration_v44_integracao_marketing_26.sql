begin;

update public.metodo_growth_versoes set atual=false where atual=true and versao<>'2.6';

insert into public.metodo_growth_versoes(versao,nome,novidades,atual,publicada_em,publicada_por)
values(
  '2.6',
  'Método Escala Growth',
  '["Integração do Motor de Crescimento com Parâmetros de Marketing","Criação automática da Pendência Inteligente de Marketing","Vínculo das recomendações ao Projeto de Evolução","Conclusão rastreável após configuração","Alerta consultivo antes da publicação"]'::jsonb,
  true,
  now(),
  'Usuário Master'
)
on conflict (versao) do update set
  nome=excluded.nome,
  novidades=excluded.novidades,
  atual=true,
  publicada_em=excluded.publicada_em,
  publicada_por=excluded.publicada_por;

commit;
