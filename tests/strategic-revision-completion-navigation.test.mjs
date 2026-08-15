import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('conclusão de revisão exige RPC atômica e confirma revisão realizada',async()=>{
 const route=await read('app/api/meeting-preparation/route.ts');
 assert.match(route,/rpc\/create_strategic_revision_draft/);
 assert.match(route,/_revision_status!=='Realizada'/);
 assert.match(route,/!created\?\.id/);
 assert.match(route,/revision_status:isRevision/);
});

test('resposta da conclusão direciona explicitamente ao plan_id criado',async()=>{
 const route=await read('app/api/meeting-preparation/route.ts');
 assert.match(route,/plano-executavel\?diagnostico_id=\$\{body\.diagnostico_id\}&plan_id=\$\{createdPlanId\}/);
 const component=await read('components/MeetingPreparation.tsx');
 assert.match(component,/!x\.plan_id\|\|!x\.revision_id\|\|x\.revision_status!=='Realizada'/);
 assert.match(component,/window\.location\.assign\(destination\)/);
 assert.match(component,/Nenhum redirecionamento foi realizado/);
});

test('autosave permanece POST e conclusão permanece PATCH',async()=>{
 const component=await read('components/MeetingPreparation.tsx');
 assert.match(component,/method:'POST'.*autosave:!manual/s);
 assert.match(component,/const conclude=async.*method:'PATCH'/s);
});

test('plano solicitado por id e plano de revisão anterior gera alerta',async()=>{
 const api=await read('app/api/strategic-execution-plan/route.ts');
 assert.match(api,/planId\?'id=eq\.'/);
 assert.match(api,/revision_mismatch:/);
 const component=await read('components/StrategicExecutionPlan.tsx');
 assert.match(component,/params\.get\('plan_id'\)/);
 assert.match(component,/&plan_id='\+encodeURIComponent\(requestedPlanId\)/);
 assert.match(component,/Este plano não corresponde à revisão estratégica mais recente\./);
});

test('migração atômica mantém rollback transacional para plano, ações, histórico e revisão',async()=>{
 const migration=await read('database/migration_v64_draft_revisao_atomico.sql');
 assert.match(migration,/create or replace function public\.create_strategic_revision_draft/i);
 assert.match(migration,/insert into public\.strategic_execution_plans/i);
 assert.match(migration,/insert into public\.strategic_execution_plan_actions/i);
 assert.match(migration,/insert into public\.strategic_execution_plan_history/i);
 assert.match(migration,/update public\.reunioes_estrategicas/i);
});
