-- V35 - Status do fluxo Financeiro, Publicação e Acesso
-- Compatibilidade entre os status legados e o novo fluxo operacional.

alter table if exists public.financeiro_growth
  drop constraint if exists financeiro_growth_status_check;

alter table if exists public.financeiro_growth
  add constraint financeiro_growth_status_check
  check (
    status is null
    or status in (
      'Links pendentes',
      'Proposta pronta',
      'Pagamento aguardando confirmação',
      'Kickoff liberado',
      'Em elaboração',
      'Plano aprovado',
      'Financeiro configurado',
      'Portal publicado',
      'Cliente acessou',
      'Aceite realizado',
      'Pagamento confirmado',
      'Projeto iniciado'
    )
  );

-- Remove somente publicações interrompidas: a versão foi criada, mas o Financeiro
-- não conseguiu confirmar a mesma versão por causa da constraint antiga.
delete from public.proposta_publicacoes publication
where not exists (
  select 1
  from public.financeiro_growth financial
  where financial.empresa_id = publication.empresa_id
    and financial.publicada_em is not null
    and financial.versao_publicada = publication.versao
);

notify pgrst, 'reload schema';
