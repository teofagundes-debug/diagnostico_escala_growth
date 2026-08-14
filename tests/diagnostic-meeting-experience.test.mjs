import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read=file=>fs.readFileSync(file,'utf8');
function load(file){const source=read(file),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};vm.runInNewContext(`(function(require,module,exports){${js}\n})(require,module,module.exports)`,{require:()=>({}),module,exports:module.exports,Set,Map,Error,String,Array,Object,Number,Boolean,RegExp,Math});return module.exports}
const briefing=load('lib/diagnosticBriefing.ts'),engine=load('lib/strategicEngine.ts');
const meeting=read('components/MeetingPreparation.tsx'),meetingApi=read('app/api/meeting-preparation/route.ts'),diagnosticUi=read('components/DiagnosticConsultantBriefing.tsx'),validation=read('components/StrategicPlanValidation.tsx');

test('direção parcial histórica é complementada em runtime sem mutar a origem',()=>{
 const calculated={available:true,strategic_direction:'ESTRUTURAR',strategic_rationale:'Base atual',primary_priority:'ABSORVER',parallel_priorities:['CONVERTER'],acquisition_movement:'ESTRUTURAR_ANTES_DE_ACELERAR',main_risk:'Perda de oportunidades.'};
 const persisted={strategic_direction:'DIREÇÃO HISTÓRICA',strategic_rationale:'Justificativa histórica',primary_priority:''},result=engine.normalizeStrategicDecision(calculated,persisted);
 assert.equal(result.strategic_direction,'DIREÇÃO HISTÓRICA');assert.equal(result.primary_priority,'ABSORVER');assert.deepEqual(Array.from(result.parallel_priorities),['CONVERTER']);assert.equal(persisted.primary_priority,'');
 assert.match(diagnosticUi,/cards\.length>0/);assert.match(diagnosticUi,/decision\.primary_priority&&/);
});

test('pontos frágeis geram perguntas compartilhadas, únicas e com identidade estável',()=>{
 const answers=[{pergunta:'Sua empresa sabe de quais canais vêm as oportunidades?',resposta_numerica:1},{pergunta:'Sua empresa sabe de quais canais vêm as oportunidades?',resposta_numerica:1},{pergunta:'Cada oportunidade tem responsável?',resposta_numerica:2},{pergunta:'Existe clareza de metas e resultados?',resposta_numerica:4}];
 const questions=briefing.investigationQuestions(answers);assert.equal(questions.length,2);assert.ok(questions.every(item=>item.id.startsWith('investigation:')));
 assert.deepEqual(Array.from(briefing.investigationQuestions(answers),item=>item.id),Array.from(questions,item=>item.id));
});

test('perguntas editadas preservam identidade, reordenação e removem duplicidade',()=>{
 const first=briefing.preparedQuestionsFromText('Pergunta A\nPergunta B\nPergunta A');assert.equal(first.length,2);
 const reordered=briefing.preparedQuestionsFromText('Pergunta B\nPergunta A',first);assert.equal(reordered[0].id,first[1].id);assert.equal(reordered[1].id,first[0].id);
 const edited=briefing.preparedQuestionsFromText('Pergunta B ajustada\nPergunta A',reordered);assert.equal(edited[0].id,reordered[0].id);
});

test('inicialização acontece uma vez e respostas usam id com fallback legado',()=>{
 assert.match(meetingApi,/meeting\.status!=='Realizada'&&!meetingData\.perguntas_preparadas_inicializadas/);
 assert.match(meetingApi,/perguntas_preparadas_inicializadas:true/);
 assert.match(meeting,/respostas_perguntas_por_id/);assert.match(meeting,/respostas_perguntas\?\.\[String\(index\)\]/);
 assert.match(meetingApi,/preparedQuestionsFromText/);
});

test('Bloco 5 registra apenas oportunidades adicionais e preserva legado documental',()=>{
 assert.doesNotMatch(meeting,/Oportunidades que deverão ser confirmadas/);
 assert.doesNotMatch(meeting,/Confirmar todas as oportunidades deste grupo/);
 assert.match(meeting,/Oportunidades adicionais identificadas na reunião/);
 assert.match(meeting,/legacyConfirmedOpportunities/);assert.match(meeting,/oportunidades:\{\.\.\.\(validations\.oportunidades/);
 assert.match(meetingApi,/legacyOpportunities/);assert.match(meetingApi,/opportunities\.adicionais\?\?opportunities\.nova/);
 assert.match(validation,/validations\.oportunidades\?\.adicionais\?\?validations\.oportunidades\?\.nova/);
});

test('nenhum fluxo novo reescreve snapshot publicado ou diagnóstico histórico',()=>{
 for(const source of [meeting,meetingApi,diagnosticUi])assert.doesNotMatch(source,/published_snapshot\s*:/);
 assert.doesNotMatch(read('lib/strategicEngine.ts'),/fetch\(|method:\s*['"]PATCH['"]/);
});
