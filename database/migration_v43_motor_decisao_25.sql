begin;

update public.metodo_growth_versoes set atual=false where atual=true and versao<>'2.5';

insert into public.metodo_growth_versoes(versao,nome,novidades,atual,publicada_em,publicada_por)
values(
  '2.5',
  'Método Escala Growth',
  '["Motor de Decisão orientado por evidências","Respostas objetivas e abertas do Diagnóstico","Validações da Reunião Estratégica","Separação entre Estrutura Obrigatória, Recomendações Estratégicas e Pendências Inteligentes","Rastreabilidade dos motivos de cada recomendação"]'::jsonb,
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
