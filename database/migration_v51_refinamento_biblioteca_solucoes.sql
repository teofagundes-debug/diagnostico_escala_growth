-- V51 - Correção e refinamento da Biblioteca de Soluções.
-- A propriedade explícita evita inferência permanente pelo nome da solução.

alter table public.catalogo_recursos
  add column if not exists utiliza_investimento_recomendado boolean not null default false;

-- Migração inicial dos serviços de mídia já conhecidos. Depois deste marco,
-- o valor é administrado exclusivamente no cadastro da própria solução.
update public.catalogo_recursos
set utiliza_investimento_recomendado = true
where lower(trim(nome)) in ('gestão google ads', 'gestao google ads', 'gestão meta ads', 'gestao meta ads')
   or lower(coalesce(categoria, '')) in ('mídia paga', 'midia paga');

-- Itens sem verba estratégica deixam de carregar valor operacional indevido.
update public.catalogo_recursos
set investimento_minimo_recomendado = 0
where utiliza_investimento_recomendado = false;

-- A Licença Nimble não gera pendência. Remove também a orientação digitada
-- acidentalmente como título, sem tocar nas demais regras da solução.
update public.catalogo_recursos
set gera_pendencias = false,
    titulo_pendencia_padrao = null,
    codigo_pendencia_padrao = null,
    rota_configuracao_padrao = null,
    abre_planejamento_operacional = true,
    permite_executor_terceiro = false,
    permite_equipe_interna = false,
    treinamento_obrigatorio = true,
    impacta_financeiro = true,
    impacta_cronograma = false,
    impacta_implantacao = true,
    cria_checklist = true,
    disponivel_evolucao_futura = false,
    utiliza_investimento_recomendado = false,
    investimento_minimo_recomendado = 0
where lower(trim(nome)) = 'licença plataforma nimble'
   or lower(trim(nome)) = 'licenca plataforma nimble';

comment on column public.catalogo_recursos.utiliza_investimento_recomendado is
  'Define explicitamente se a solução utiliza verba estratégica externa e deve exibir o investimento mínimo recomendado.';

notify pgrst, 'reload schema';
