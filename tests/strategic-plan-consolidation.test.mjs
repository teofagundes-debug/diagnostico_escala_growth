import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const validation=await readFile(new URL('../components/StrategicPlanValidation.tsx',import.meta.url),'utf8');
const central=await readFile(new URL('../components/CentralApp.tsx',import.meta.url),'utf8');
const portal=await readFile(new URL('../components/PortalApp.tsx',import.meta.url),'utf8');

test('consolidação usa o novo componente consultivo',()=>{
 assert.match(central,/StrategicPlanValidation as PlanEditor/);
 assert.match(central,/function LegacyPlanEditor/);
});

test('Resumo Executivo e Situação Atual permanecem em leitura',()=>{
 assert.match(validation,/strategic-readonly/);
 assert.ok(validation.includes('Resumo Executivo'));
 assert.ok(validation.includes('Situação Atual'));
 assert.equal((validation.match(/<textarea/g)||[]).length,2);
});

test('somente Parecer Final é obrigatório e observações são opcionais',()=>{
 assert.ok(validation.includes('Parecer Final do Consultor'));
 assert.ok(validation.includes('Observações Complementares'));
 assert.match(validation,/if\(!opinion\.trim\(\)\)/);
 assert.doesNotMatch(validation,/!.*objetivos.*prioridades/);
});

test('versão oficial mantém a estrutura estratégica automática',()=>{
 for(const section of ['Resumo Executivo','Situação Atual','Objetivo Estratégico','Plano de Evolução','Cronograma','Soluções Recomendadas','Parecer Final do Consultor','Próximos Passos'])assert.ok(portal.includes(section),section);
 assert.match(portal,/consultant\.observations&&/);
});

test('persistência reutiliza os endpoints e campos existentes',()=>{
 assert.ok(validation.includes('/api/central?resource=strategic-plan'));
 assert.ok(validation.includes('/api/diagnostics'));
 assert.ok(validation.includes('/api/central?resource=versions'));
 assert.ok(validation.includes('/api/central?resource=workflow'));
});
