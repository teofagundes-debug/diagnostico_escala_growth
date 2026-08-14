import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const diagnostics=read('app/api/diagnostics/route.ts');
const api=read('app/api/strategic-implementations/route.ts');
const center=read('components/StrategicImplementationCenter.tsx');
const central=read('components/CentralApp.tsx');

test('diagnóstico expõe Planos Executáveis para decidir o fluxo oficial',()=>{
 assert.match(diagnostics,/strategic_execution_plans\?diagnostico_id=eq/);
 assert.match(diagnostics,/strategic_execution_plans:executionPlans/);
 assert.match(central,/if\(list\(data\.strategic_execution_plans\)\.length\)return/);
 assert.match(central,/Abrir Central de Implantações/);
});

test('Central oficial lista somente implantações por plan_id e plan_version',()=>{
 assert.match(api,/item\.plan_id===plan\.id&&Number\(item\.plan_version\)===Number\(plan\.version_number\)/);
 assert.match(api,/strategic_plan_implementations\?select=/);
 assert.match(api,/published_snapshot=not\.is\.null/);
 assert.match(center,/Implantações oficiais/);
});

test('legado permanece separado e identificado como histórico',()=>{
 assert.match(api,/legacy_implementations:legacyHistorical/);
 assert.match(api,/flow:'LEGADO',historical:true/);
 assert.match(center,/Implantações históricas do fluxo anterior/);
 assert.match(center,/não são combinados com as Implantações oficiais/);
});

test('criação oficial continua copiando apenas o snapshot publicado',()=>{
 assert.match(api,/rpc\/create_strategic_plan_implementation/);
 assert.doesNotMatch(api,/existingResourceResolver|projeto_solucoes_aprovadas|projeto_solucoes_vinculadas/);
 assert.match(central,/function ImplementationPlan/);
});
