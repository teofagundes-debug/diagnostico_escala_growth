import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const central = fs.readFileSync('components/CentralApp.tsx', 'utf8');
const menu = central.slice(central.indexOf('const menu='), central.indexOf(';', central.indexOf('const menu=')) + 1);

test('menu administrativo usa apenas o Plano Estratégico Executável', () => {
  assert.ok(menu.includes("['Plano Estratégico Executável','/central/plano-executavel']"));
  assert.ok(!menu.includes("['Planos Estratégicos','/central/planos']"));
});

test('ordem operacional do menu permanece a oficial', () => {
  const expected = [
    'Dashboard', 'Pipeline', 'Empresas', 'Diagnósticos',
    'Plano Estratégico Executável', 'Implantações', 'Evolução do IEG', 'Agenda',
    'Biblioteca de Soluções Escala Growth', 'Simulador Comercial', 'Configurações',
  ];
  let previous = -1;
  for (const label of expected) {
    const position = menu.indexOf(`'${label}'`);
    assert.ok(position > previous, `${label} deve manter a ordem esperada`);
    previous = position;
  }
});

test('rota legada é preservada apenas para compatibilidade interna', () => {
  assert.ok(fs.existsSync('app/central/planos/page.tsx'));
  assert.ok(central.includes("view==='planos'?<Plans"));
});
