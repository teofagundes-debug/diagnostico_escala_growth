import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const validation=await readFile(new URL('../components/StrategicPlanValidation.tsx',import.meta.url),'utf8');
const central=await readFile(new URL('../components/CentralApp.tsx',import.meta.url),'utf8');
const portal=await readFile(new URL('../components/PortalApp.tsx',import.meta.url),'utf8');
const document=await readFile(new URL('../components/StrategicPlanDocument.tsx',import.meta.url),'utf8');

test('consolidação usa o novo componente consultivo',()=>{
 assert.match(central,/StrategicPlanValidation as PlanEditor/);
 assert.match(central,/function LegacyPlanEditor/);
});

test('consultor produz somente o Parecer Final',()=>{
 assert.ok(validation.includes('Documento executivo automático'));
 assert.doesNotMatch(validation,/strategic-readonly/);
 assert.equal((validation.match(/<textarea/g)||[]).length,1);
});

test('Parecer Final é o único conteúdo manual obrigatório',()=>{
 assert.ok(validation.includes('Parecer Final do Consultor'));
 assert.doesNotMatch(validation,/Observações Complementares/);
 assert.match(validation,/if\(!opinion\.trim\(\)\)/);
 assert.doesNotMatch(validation,/!.*objetivos.*prioridades/);
});

test('versão oficial mantém a estrutura estratégica automática',()=>{
 assert.match(portal,/StrategicPlanDocument/);
 for(const section of ['Visão Executiva','Objetivo Estratégico','Plano de Evolução','Cronograma','Soluções Recomendadas','Parecer Final do Consultor','Próximos Passos'])assert.ok(document.includes(section),section);
 for(const removed of ['Hipóteses Validadas','Perguntas específicas','Recursos Já Implantados','Oportunidades Confirmadas'])assert.ok(!document.includes(removed),removed);
 assert.ok(document.includes('Ver detalhes'));
 assert.ok(document.includes("['Plano Estratégico','Proposta de Implantação','Aceite','Contrato','Pagamento','Implantação','Área do Cliente','Método Escala Growth']"));
});

test('persistência reutiliza os endpoints e campos existentes',()=>{
 assert.ok(validation.includes('/api/central?resource=strategic-plan'));
 assert.ok(validation.includes('/api/diagnostics'));
 assert.ok(validation.includes('/api/central?resource=versions'));
 assert.ok(validation.includes('/api/central?resource=workflow'));
});
