import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const correction=fs.readFileSync(new URL('../database/migration_v55_correcao_criacao_implantacao.sql',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../app/api/strategic-implementations/route.ts',import.meta.url),'utf8');
const component=fs.readFileSync(new URL('../components/StrategicImplementationCenter.tsx',import.meta.url),'utf8');

test('criacao resolve a acao atual sem confiar no UUID historico do snapshot',()=>{
 assert.match(correction,/current_action\.plan_id=p\.id/);
 assert.match(correction,/current_action\.source_action_code=action->>'source_action_code'/);
 assert.doesNotMatch(correction,/\(action->>'id'\)::uuid/);
 assert.match(correction,/origin_snapshot/);
});

test('API retorna resultado estruturado e detalhe auditavel por etapa',()=>{
 assert.match(api,/implementation_id:String\(id\)/);
 assert.match(api,/technical_detail/);
 assert.match(api,/snapshot_actions/);
 assert.match(api,/rpc_arguments/);
 assert.match(api,/created_items/);
 assert.match(component,/Detalhe da criação da Implantação/);
});
