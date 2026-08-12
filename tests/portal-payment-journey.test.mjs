import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const portal = fs.readFileSync('components/PortalApp.tsx', 'utf8');
const api = fs.readFileSync('app/api/portal/route.ts', 'utf8');
const css = fs.readFileSync('app/globals.css', 'utf8');
const contracting = portal.slice(portal.indexOf('function Contracting'), portal.indexOf('function Evolution'));

test('pagamentos externos preservam a tela original do Portal', () => {
  assert.ok(contracting.includes("window.open(link,'_blank','noopener,noreferrer')"));
  assert.ok(!contracting.includes('setWaiting'));
  assert.ok(!contracting.includes('if(waiting)'));
});

test('clique registra somente pagamento aguardando confirmacao', () => {
  assert.ok(contracting.includes("action:'payment_started'"));
  assert.ok(api.includes('Pagamento aguardando confirma'));
  assert.ok(!contracting.includes("action:'confirm_payment'"));
});

test('jornada explica implantacao e ativacao mensal', () => {
  for (const text of [
    'Para iniciarmos os trabalhos',
    '1. Pagamento da implantação',
    '2. Ativação da mensalidade',
    'Liberação das licenças de uso para início dos trabalhos.',
  ]) assert.ok(portal.includes(text));
});

test('valores continuam derivados da fonte financeira atual', () => {
  assert.ok(contracting.includes('f.valor_implantacao'));
  assert.ok(contracting.includes('f.desconto_pix'));
  assert.ok(contracting.includes('f.valor_mensalidade'));
});

test('layout da jornada possui tratamento responsivo', () => {
  assert.ok(css.includes('.payment-journey-info>div'));
  assert.ok(css.includes('.contracting-summary .btn,.subscription-offer .btn{width:100%}'));
});
