import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lib/strategicImplementationItem.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
vm.runInNewContext(js,{module,exports:module.exports,Set,String,Date,Number,Error});
const{normalizeImplementationItemChanges}=module.exports;

test('normaliza datas do formulário para os tipos PostgreSQL',()=>{
 const changes=normalizeImplementationItemChanges({operational_due_date:'2026-08-31',started_at:'2026-08-14',completed_at:''});
 assert.equal(changes.operational_due_date,'2026-08-31');
 assert.equal(changes.started_at,'2026-08-14T12:00:00.000Z');
 assert.equal(changes.completed_at,null);
});

test('preserva os três status operacionais e rejeita status de plano',()=>{
 assert.equal(normalizeImplementationItemChanges({status:'PLANNED'}).status,'PLANNED');
 assert.equal(normalizeImplementationItemChanges({status:'IN_PROGRESS'}).status,'IN_PROGRESS');
 assert.equal(normalizeImplementationItemChanges({status:'COMPLETED'}).status,'COMPLETED');
 assert.throws(()=>normalizeImplementationItemChanges({status:'PUBLISHED'}),/inválido/i);
});

test('campos opcionais vazios tornam-se null sem apagar valor não vazio',()=>{
 const changes=normalizeImplementationItemChanges({operational_responsible:'Teófilo',execution_notes:'',execution_evidence:'Evidência'});
 assert.equal(changes.operational_responsible,'Teófilo');
 assert.equal(changes.execution_notes,null);
 assert.equal(changes.execution_evidence,'Evidência');
});

test('API confirma o registro salvo antes de atualizar resumo e histórico',()=>{
 const api=fs.readFileSync(new URL('../app/api/strategic-implementations/route.ts',import.meta.url),'utf8');
 assert.match(api,/normalizeImplementationItemChanges\(body\)/);
 assert.match(api,/if\(!saved\?\.id\)/);
 assert.match(api,/Prefer:'return=representation'/);
});
