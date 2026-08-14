import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file){const source=fs.readFileSync(file,'utf8'),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}},stub=()=>({});vm.runInNewContext(`(function(require,module,exports){${js}\n})(require,module,module.exports)`,{require:stub,module,exports:module.exports,Date,Number,String,Array,Object,Set});return module.exports}
const resolver=load('lib/strategicRevisionResolver.ts');
const original={id:'meeting-1',status:'Realizada',revisao_numero:1,realizada_em:'2026-08-14T12:00:00Z',created_at:'2026-08-14T10:00:00Z',dados_reuniao:{situacao_plataforma:{'Agente de IA':'Não Implantado'},validacoes_reuniao:{conclusao:{resumo_executivo:'Resumo original intacto'}}}};
const revision={id:'meeting-2',status:'Realizada',revisao_numero:2,realizada_em:'2026-08-14T12:00:00Z',created_at:'2026-08-14T11:00:00Z',dados_reuniao:{situacao_plataforma:{'Plataforma Nimble':'Implantado','Agente de IA':'Implantado'},diagnostico_validado:{recomendacoes_adaptativas:[{recurso:'Plataforma Nimble',recurso_codigo:'PLA-001',status_recurso:'Implantado',recomendacao_validada:'Manter Plataforma Nimble',adaptada:false},{recurso:'Agente de IA',recurso_codigo:'IA-001',status_recurso:'Implantado',recomendacao_validada:'Otimizar utilização do Agente de IA',adaptada:true}]},validacoes_reuniao:{conclusao:{resumo_executivo:'Resumo revisão 2 com Plataforma Nimble'}}}};

test('maior revisao_numero vence quando reunião original e revisão têm a mesma data',()=>assert.equal(resolver.resolveCurrentStrategicRevision([original,revision]).id,'meeting-2'));
test('vínculo explícito do artefato tem prioridade',()=>assert.equal(resolver.resolveCurrentStrategicRevision([original,revision],'meeting-1').id,'meeting-1'));
test('recursos atuais vêm exclusivamente da situação estruturada vigente',()=>assert.deepEqual(Array.from(resolver.currentPlatformResources(revision),x=>`${x.name}:${x.status}`),['Plataforma Nimble:Implantado','Agente de IA:Implantado']));
test('recurso implantado não retorna como aquisição e otimização permanece evolução',()=>{const steps=resolver.currentRevisionNextSteps(revision);assert.doesNotMatch(steps,/Licença Plataforma Nimble/);assert.doesNotMatch(steps,/Manter Plataforma Nimble/);assert.match(steps,/Otimizar utilização do Agente de IA/)});
test('resumo histórico original não é modificado pela resolução',()=>{resolver.resolveCurrentStrategicRevision([original,revision]);assert.equal(original.dados_reuniao.validacoes_reuniao.conclusao.resumo_executivo,'Resumo original intacto');assert.match(revision.dados_reuniao.validacoes_reuniao.conclusao.resumo_executivo,/Plataforma Nimble/)});

test('Plano Executável preserva vínculo explícito com a revisão',()=>{const route=fs.readFileSync('app/api/meeting-preparation/route.ts','utf8');assert.match(route,/revisao_estrategica_id:input\.meeting\.id/)});
