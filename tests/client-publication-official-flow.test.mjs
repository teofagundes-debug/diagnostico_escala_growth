import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../lib/clientPublicationReadiness.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};new Function('module','exports',js)(module,module.exports);
const {selectPublicationProject,officialImplementationReadiness,commercialConsolidationReadiness,legacyPublicationReadiness}=module.exports;
const plan={id:'plan-v13',version_number:13};
const project=(id,planId,version,updated='2026-08-17')=>({id,status:'Rascunho',updated_at:updated,checklist:{strategic_context:{flow:'ESTRATEGICO_3_0',plan_id:planId,plan_version:version}},valor_implantacao_adicional:1500,nova_mensalidade:1230,commercial_3_0_status:'PRONTO',commercial_3_0_snapshot:{financial:{valor_implantacao:1500,valor_mensalidade:1230},resources:[{recurso_id:'r1'}]},projeto_evolucao_recursos:[{recurso_id:'r1'}]});
const item=(patch={})=>({operational_responsible:'Teófilo',operational_due_date:'2026-08-31',agreed_horizon:'AGORA',status:'PLANNED',...patch});

test('V13 seleciona somente o Projeto vinculado, mesmo que outra versão seja mais recente',()=>{const selected=selectPublicationProject([project('v12','plan-v12',12,'2026-08-18'),project('v13','plan-v13',13,'2026-08-17')],plan);assert.equal(selected.id,'v13')});
test('V13 completa é válida e V10/V12 incompletas não participam',()=>{const state=officialImplementationReadiness({id:'impl-v13',plan_id:'plan-v13',plan_version:13},[item(),item()]);assert.equal(state.ready,true);assert.equal(state.missingResponsible.length,0);assert.equal(state.missingDue.length,0)});
test('progresso zero e status PLANNED não bloqueiam publicação',()=>assert.equal(officialImplementationReadiness({id:'impl-v13'},[item({status:'PLANNED'})]).ready,true));
test('item sem responsável bloqueia',()=>assert.equal(officialImplementationReadiness({id:'impl-v13'},[item({operational_responsible:''})]).ready,false));
test('prazo é obrigatório em Agora/Depois e dispensado em Quando estiver pronto',()=>{assert.equal(officialImplementationReadiness({id:'i'},[item({operational_due_date:'',agreed_horizon:'DEPOIS'})]).ready,false);assert.equal(officialImplementationReadiness({id:'i'},[item({operational_due_date:'',agreed_horizon:'QUANDO_ESTIVER_PRONTO'})]).ready,true)});
test('Consolidação 3.0 válida usa valores congelados sem recalcular',()=>{const p=project('v13','plan-v13',13),financial={valor_implantacao:1500,valor_mensalidade:1230};assert.equal(commercialConsolidationReadiness(p,financial,true).ready,true)});
test('divergência financeira ou de recursos bloqueia',()=>{const p=project('v13','plan-v13',13);assert.equal(commercialConsolidationReadiness(p,{valor_implantacao:0,valor_mensalidade:1230},true).ready,false);p.projeto_evolucao_recursos=[];assert.equal(commercialConsolidationReadiness(p,{valor_implantacao:1500,valor_mensalidade:1230},true).ready,false)});
test('projeto histórico sem strategic_context mantém fallback legado',()=>{const legacy={id:'old',status:'Rascunho',checklist:{configuracoes_implantacao_concluidas:true,executor_definido:true,resumo_financeiro_atualizado:true}};assert.equal(selectPublicationProject([legacy],null),legacy);assert.deepEqual(legacyPublicationReadiness(legacy),{configuration:true,executor:true,financial:true})});
test('API usa consultas canônicas e não altera snapshots',()=>{const api=fs.readFileSync(new URL('../app/api/client-access/route.ts',import.meta.url),'utf8');assert.match(api,/strategic_execution_plans\?empresa_id=.*status=eq\.PUBLISHED/);assert.match(api,/strategic_plan_implementations\?plan_id=eq\./);assert.match(api,/plan_version=eq\./);assert.match(api,/strategic_plan_implementation_items\?implementation_id=eq\./);assert.doesNotMatch(api,/strategic_execution_plans.*method:'PATCH'/);assert.doesNotMatch(api,/strategic_plan_implementations.*method:'PATCH'/)});
