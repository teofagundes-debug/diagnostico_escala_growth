import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api=fs.readFileSync(new URL('../app/api/strategic-execution-plan/route.ts',import.meta.url),'utf8');
const component=fs.readFileSync(new URL('../components/StrategicExecutionPlan.tsx',import.meta.url),'utf8');

test('respostas vazias de sucesso do Supabase não são interpretadas como JSON',()=>{
 assert.match(api,/if\(!text\.trim\(\)\)return\[\]/);
 assert.doesNotMatch(api,/response\.status===204\?\[\]:response\.json\(\)/);
});

test('salvar rascunho retorna JSON de sucesso padronizado',()=>{
 assert.match(api,/ok:true,message:published\?'Plano publicado com sucesso\.':'Rascunho salvo com sucesso\.'/);
 assert.match(api,/plan_id:updated\.id,version:updated\.version_number,status:updated\.status/);
});

test('frontend trata corpo vazio e conteúdo não JSON sem retry automático',()=>{
 assert.match(component,/safeResponsePayload\(response\)/);
 assert.match(component,/if\(!text\.trim\(\)\)return\{\}/);
 assert.doesNotMatch(component,/retry/i);
});
