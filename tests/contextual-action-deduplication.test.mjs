import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file){const source=fs.readFileSync(file,'utf8'),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};vm.runInNewContext(`(function(require,module,exports){${js}\n})(require,module,module.exports)`,{require:()=>({}),module,exports:module.exports,Set,Map,Error,String,Array,Object,Number,Boolean,RegExp});return module.exports}
const resolver=load('lib/resourcePrescriptionResolver.ts');
const catalog=[{id:'resource-ai',codigo:'IA-001',nome:'Agente de IA'},{id:'resource-crm',codigo:'CRM-001',nome:'CRM'}];
const contextual=(resourceId='resource-ai',validated='Otimizar utilização do recurso',interventions=['INT_A'])=>({original:'Recomendação original',validated,resource:'Recurso',resource_id:resourceId,resource_code:resourceId==='resource-ai'?'IA-001':'CRM-001',resource_status:'Implantado',adapted:true,commercial_eligible:false,decision:'MANTER_ACAO_ESTRATEGICA',reason:'Evolução do recurso existente.',canonical_resource_id:resourceId,canonical_solution_id:null,canonical_solution_code:resourceId==='resource-ai'?'IA-001':'CRM-001',intervention_codes:interventions,state_code:'IMPLANTADO',context_version:'1.0'});
const contextualAction=item=>({source_type:'CONSULTANT',action_origin:'CONTEXTUAL',contextual_action_key:item.contextual_action_key,recommended_snapshot:{...item,source:'REVISAO_ESTRATEGICA'}});

test('uma prescrição contextual gera uma única decisão executável',()=>{
 const result=resolver.consolidateContextualPrescriptions([contextual()]);
 assert.equal(result.length,1);
 assert.match(result[0].contextual_action_key,/contextual-v1:resource-ai:OTIMIZAR:/);
});

test('mesma decisão em cinco revisões não acumula cópias',()=>{
 let previous=[];
 for(let revision=1;revision<=5;revision++){
  const current=resolver.consolidateContextualPrescriptions([contextual()]);
  previous=[...resolver.actionsPreservedForRevision(previous,current),...current.map(contextualAction)];
  assert.equal(previous.length,1,`revisão ${revision}`);
 }
});

test('duas decisões distintas geram duas ações',()=>{
 const result=resolver.consolidateContextualPrescriptions([contextual('resource-ai','Otimizar utilização do recurso'),contextual('resource-crm','Concluir configuração do CRM')]);
 assert.equal(result.length,2);
 assert.notEqual(result[0].contextual_action_key,result[1].contextual_action_key);
});

test('múltiplas evidências da mesma decisão sustentam uma única ação',()=>{
 const result=resolver.consolidateContextualPrescriptions([contextual('resource-ai','Otimizar utilização do recurso',['INT_A']),contextual('resource-ai','Otimizar utilização do recurso',['INT_B'])]);
 assert.equal(result.length,1);
 assert.deepEqual(Array.from(result[0].intervention_codes).sort(),['INT_A','INT_B']);
 assert.equal(result[0].supporting_prescriptions.length,2);
});

test('manual independente e Motor elegível são preservados; contexto antigo é removido',()=>{
 const current=[contextual('resource-ai','Otimizar utilização do recurso',['INT_A'])];
 const previous=[{source_type:'CONSULTANT',action_origin:'MANUAL',agreed_title:'Ação manual'},contextualAction(resolver.consolidateContextualPrescriptions(current)[0]),{source_type:'ENGINE',source_action_code:'ACT_OK',recommended_snapshot:{intervention_code:'INT_OK'}},{source_type:'ENGINE',source_action_code:'ACT_BLOCKED',recommended_snapshot:{intervention_codes:['INT_A']}}];
 const preserved=resolver.actionsPreservedForRevision(previous,current);
 assert.deepEqual(Array.from(preserved,item=>item.agreed_title||item.source_action_code),['Ação manual','ACT_OK']);
});

test('migration protege duplicação contextual sem reescrever históricos',()=>{
 const sql=fs.readFileSync('database/migration_v62_identidade_acoes_contextuais.sql','utf8');
 assert.match(sql,/add column if not exists action_origin/);
 assert.match(sql,/add column if not exists contextual_action_key/);
 assert.match(sql,/create unique index if not exists strategic_execution_actions_contextual_unique/);
 assert.match(sql,/where action_origin='CONTEXTUAL'/);
 assert.doesNotMatch(sql,/update\s+public\.strategic_execution_plan_actions/i);
});

test('rota rematerializa contexto vigente e não altera planos publicados antigos',()=>{
 const meeting=fs.readFileSync('app/api/meeting-preparation/route.ts','utf8'),plan=fs.readFileSync('app/api/strategic-execution-plan/route.ts','utf8');
 assert.match(meeting,/actionsPreservedForRevision/);
 assert.match(meeting,/consolidateContextualPrescriptions/);
 assert.match(meeting,/action_origin:'CONTEXTUAL'/);
 assert.match(plan,/contextualKeys/);
 assert.match(plan,/Versões publicadas são imutáveis/);
});
