import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync(new URL('../database/migration_v54_implantacao_plano_executavel.sql',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../app/api/strategic-implementations/route.ts',import.meta.url),'utf8');
const component=fs.readFileSync(new URL('../components/StrategicImplementationCenter.tsx',import.meta.url),'utf8');

test('implantação nasce somente de Plano Executável publicado com snapshot e ações',()=>{
 assert.match(migration,/p\.status not in \('PUBLISHED','SUPERSEDED'\)/);
 assert.match(migration,/p\.published_snapshot is null/);
 assert.match(migration,/jsonb_array_length\(actions\)=0/);
 assert.match(migration,/jsonb_array_elements\(actions\)/);
});

test('snapshot operacional preserva rastreabilidade e não altera o Plano',()=>{
 for(const field of ['plan_id','plan_version','source_snapshot','origin_action_id','source_action_code','origin_snapshot','agreed_horizon','agreed_responsible'])assert.match(migration,new RegExp(field));
 assert.doesNotMatch(api,/strategic_execution_plans[^'\n]*method:'PATCH'/);
 assert.doesNotMatch(api,/diagnosticos[^'\n]*method:'PATCH'/);
});

test('backend impede duplicidade por plano e versão',()=>{
 assert.match(migration,/unique\(plan_id,plan_version\)/);
 assert.match(migration,/exception when unique_violation/);
 assert.match(api,/existing:true/);
});

test('somente os três estados operacionais homologados são utilizados',()=>{
 assert.match(migration,/check\(status in \('PLANNED','IN_PROGRESS','COMPLETED'\)\)/);
 assert.doesNotMatch(migration,/CANCELLED/);
 assert.match(api,/completed\?'COMPLETED':started\?'IN_PROGRESS':'PLANNED'/);
});

test('interface organiza itens pelos três horizontes e mantém debug administrativo',()=>{
 for(const horizon of ['AGORA','DEPOIS','QUANDO_ESTIVER_PRONTO'])assert.match(component,new RegExp(horizon));
 assert.match(component,/Implantação — Debug administrativo/);
 assert.match(component,/Responsável acordado/);
 assert.match(component,/Responsável operacional/);
});

test('Sprint não depende das engines nem altera o módulo legado',()=>{
 assert.doesNotMatch(api,/strategicDecision|strategicInterventions|strategicActionPlan|acquisitionReadiness/);
 assert.doesNotMatch(migration,/alter table public\.planos_implantacao|update public\.planos_implantacao/);
});
