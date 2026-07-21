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

notify pgrst, 'reload schema';
