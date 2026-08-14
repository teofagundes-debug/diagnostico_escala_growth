import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file,stubs={}){
 const source=fs.readFileSync(file,'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(`(function(require,module,exports){${js}\n})(require,module,module.exports)`,{require:id=>stubs[id]||{},module,exports:module.exports,Set,Map,Error});
 return module.exports;
}

const existing=load('lib/existingResourceResolver.ts');
const motor=load('lib/motor-growth.ts');
const solution=(id,codigo,nome,extra={})=>({id,codigo,nome,ativo:true,tipo:'Implantação',classificacao_comercial:'Obrigatória',impacta_cronograma:true,...extra});
const pla=solution('pla-id','PLA-001','Licença Plataforma Nimble',{tipo:'Mensalidade',impacta_cronograma:false});
const ia=solution('ia-id','IA-001','Ativação e Treinamento de Agente de IA');
const dashboard=solution('dash-id','DAT-001','Dashboard Executivo');
const catalog=[pla,ia,dashboard];

function compose(adaptiveRecommendations=[]){
 const existingResources=existing.resolveCanonicalExistingResources({catalog,adaptiveRecommendations});
 return motor.composeGrowthProject({catalog,existingResources,priority:'Organizar'});
}

test('PLA-001 implantada não retorna como nova contratação ou próximo passo',()=>{
 const output=compose([{recurso_codigo:'PLA-001',status_recurso:'Implantado',recomendacao_validada:'Manter a Plataforma Nimble'}]);
 assert.equal(output.mandatory.some(item=>item.codigo==='PLA-001'),false);
 assert.equal(output.documentaryNextSteps.some(item=>item.codigo==='PLA-001'),false);
});

test('PLA-001 ausente continua elegível como novo recurso',()=>{
 const output=compose();
 const step=output.documentaryNextSteps.find(item=>item.codigo==='PLA-001');
 assert.equal(step.classificacao,'NOVA_CONTRATACAO');
 assert.equal(step.recurso_id,'pla-id');
});

test('IA implantada com otimização vira evolução sem nova implantação',()=>{
 const output=compose([{recurso_codigo:'IA-001',status_recurso:'Implantado',recomendacao_validada:'Otimizar utilização do Agente de IA'}]);
 const step=output.documentaryNextSteps.find(item=>item.codigo==='IA-001');
 assert.equal(step.classificacao,'EVOLUCAO');
 assert.match(step.acao,/Evoluir e otimizar/);
 assert.equal(output.mandatory.some(item=>item.codigo==='IA-001'),false);
});

test('recurso parcialmente implantado permanece decisão pendente',()=>{
 const output=compose([{recurso_codigo:'DAT-001',status_recurso:'Parcialmente Implantado',recomendacao_validada:'Concluir Dashboard'}]);
 const step=output.documentaryNextSteps.find(item=>item.codigo==='DAT-001');
 assert.equal(step.classificacao,'PARCIALMENTE_IMPLANTADO');
 assert.match(step.acao,/Definir a conclusão ou evolução/);
 assert.equal(output.mandatory.some(item=>item.codigo==='DAT-001'),false);
});

test('regeneração escreve nova versão documental sem atualizar snapshots publicados',()=>{
 const route=fs.readFileSync('app/api/regeneration/route.ts','utf8');
 assert.match(route,/plano_estrategico_versoes/);
 assert.match(route,/planos_estrategicos\?id=eq/);
 assert.doesNotMatch(route,/strategic_execution_plans.*PATCH|published_snapshot\s*:/s);
 assert.doesNotMatch(route,/strategic_plan_implementations.*PATCH/s);
});
