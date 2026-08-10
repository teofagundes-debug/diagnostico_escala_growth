import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lib/implementation-management.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};vm.runInNewContext(js,{module,exports:module.exports,Date,Math,Object,String,Array});
const{implementationManagement,sortOperationalItems}=module.exports;
const now=new Date('2026-08-15T12:00:00Z');
const action=(status,horizon,due,responsible='Carlos')=>({id:Math.random(),status,agreed_horizon:horizon,operational_due_date:due,operational_responsible:responsible,agreed_title:horizon});

test('Teste A: um item em andamento e dois planejados produzem progresso zero',()=>{const m=implementationManagement([action('IN_PROGRESS','AGORA','2026-08-20'),action('PLANNED','DEPOIS','2026-08-21'),action('PLANNED','QUANDO_ESTIVER_PRONTO',null)],now).summary;assert.equal(m.progress_percentage,0);assert.equal(m.status,'IN_PROGRESS')});
test('Teste B: uma de tres concluida produz 33%',()=>{const m=implementationManagement([action('COMPLETED','AGORA','2026-08-10'),action('IN_PROGRESS','DEPOIS','2026-08-20'),action('PLANNED','QUANDO_ESTIVER_PRONTO',null)],now).summary;assert.equal(m.completed_items,1);assert.equal(m.progress_percentage,33);assert.equal(m.status,'IN_PROGRESS')});
test('Teste C: prazo vencido calcula atraso sem alterar status',()=>{const m=implementationManagement([action('IN_PROGRESS','AGORA','2026-08-10')],now);assert.equal(m.items[0].is_overdue,true);assert.equal(m.items[0].days_overdue,5);assert.equal(m.items[0].status,'IN_PROGRESS')});
test('Teste D: responsavel vazio incrementa pendencia',()=>assert.equal(implementationManagement([action('PLANNED','AGORA','2026-08-20','')],now).summary.missing_responsible,1));
test('Testes E e F: prazo ausente conta em Depois, mas nao em Quando estiver pronto',()=>{const m=implementationManagement([action('PLANNED','DEPOIS',null),action('PLANNED','QUANDO_ESTIVER_PRONTO',null)],now).summary;assert.equal(m.missing_due_date,1)});
test('Teste G: todas concluidas consolidam 100% e COMPLETED',()=>{const m=implementationManagement([action('COMPLETED','AGORA','2026-08-10'),action('COMPLETED','DEPOIS','2026-08-12')],now).summary;assert.equal(m.progress_percentage,100);assert.equal(m.status,'COMPLETED')});
test('Teste H: item reaberto reconsolida IN_PROGRESS',()=>assert.equal(implementationManagement([action('COMPLETED','AGORA','2026-08-10'),action('IN_PROGRESS','DEPOIS','2026-08-20')],now).summary.status,'IN_PROGRESS'));
test('ordenacao gerencial prioriza atraso, andamento, planejada e concluida',()=>{const sorted=sortOperationalItems(implementationManagement([action('COMPLETED','AGORA','2026-08-01'),action('PLANNED','AGORA','2026-08-20'),action('IN_PROGRESS','AGORA','2026-08-20'),action('PLANNED','AGORA','2026-08-10')],now).items);assert.deepEqual(Array.from(sorted,item=>[item.is_overdue,item.status]),[[true,'PLANNED'],[false,'IN_PROGRESS'],[false,'PLANNED'],[false,'COMPLETED']])});

test('Teste I: API gerencial nao altera Plano nem snapshot',()=>{const api=fs.readFileSync(new URL('../app/api/strategic-implementations/route.ts',import.meta.url),'utf8');assert.doesNotMatch(api,/strategic_execution_plans[^'\n]*method:'PATCH'/);assert.doesNotMatch(api,/published_snapshot[^'\n]*method:'PATCH'/);assert.match(api,/ITEM_REOPENED/);assert.match(api,/implementationManagement/)});
