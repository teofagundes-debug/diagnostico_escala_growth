import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api=fs.readFileSync(new URL('../app/api/strategic-execution-plan/route.ts',import.meta.url),'utf8');
const materializer=fs.readFileSync(new URL('../lib/diagnosticEnginePersistence.ts',import.meta.url),'utf8');
const server=fs.readFileSync(new URL('../lib/diagnosticEnginePersistenceServer.ts',import.meta.url),'utf8');
const diagnosticApp=fs.readFileSync(new URL('../components/DiagnosticApp.tsx',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../components/StrategicExecutionPlan.tsx',import.meta.url),'utf8');

test('a API da Sprint 9 usa somente o materializador canônico compartilhado',()=>{
 assert.match(api,/ensureDiagnosticEngineResultsPersisted/);
 assert.doesNotMatch(api,/strategicDecision\(|strategicInterventions\(|strategicActionPlan\(|acquisitionReadiness\(|attractionNeed\(|conversionCapacity\(|growthManagementCapacity\(/);
});

test('o materializador usa as oito engines canônicas na ordem de dependência',()=>{
 const calls=['evidenceFromStoredAnswers(','acquisitionReadiness(','attractionNeed(','conversionCapacity(','growthManagementCapacity(','strategicDecision(','strategicInterventions(','strategicActionPlan('];
 let previous=-1;
 for(const call of calls){const current=materializer.indexOf(call);assert.ok(current>previous,call+' deve aparecer na ordem canônica');previous=current}
});

test('camadas persistidas são preservadas e somente ausências são materializadas',()=>{
 assert.match(materializer,/if\(indicators\[key\]\)\{debug\.push/);
 assert.match(materializer,/status:'OK'/);
 assert.match(materializer,/status:'MATERIALIZADO'/);
 assert.match(server,/if\(result\.changed\)await persist\(result\.report\)/);
});

test('a persistência é pontual para um diagnóstico e suas respostas',()=>{
 assert.match(api,/diagnosticos\?id=eq\./);
 assert.match(api,/respostas\?diagnostico_id=eq\./);
 assert.doesNotMatch(api,/diagnosticos\?select=\*/);
 assert.doesNotMatch(api,/operation:'publish'/);
});

test('diagnósticos novos continuam persistindo a cadeia completa',()=>{
 for(const key of ['evidencias_estruturadas','prontidao_aquisicao','necessidade_atrair','capacidade_conversao','capacidade_gestao_crescimento','direcao_estrategica','strategic_interventions','strategic_action_plan'])assert.match(diagnosticApp,new RegExp(key));
});

test('Sprint 9 solicita materialização antes de inicializar o plano executável',()=>{
 assert.match(ui,/operation:'ensure-action-plan'/);
 assert.match(ui,/operation:'initialize'/);
 assert.ok(ui.indexOf("operation:'ensure-action-plan'")<ui.indexOf("operation:'initialize'"));
});

test('URL do Supabase não sombreia o construtor global URL',()=>{
 assert.match(api,/const SUPABASE_URL=process\.env\.SUPABASE_URL/);
 assert.doesNotMatch(api,/const URL=process\.env\.SUPABASE_URL/);
});
