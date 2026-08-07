import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const central=read('../components/CentralApp.tsx');
const meeting=read('../components/MeetingPreparation.tsx');
const briefing=read('../components/DiagnosticConsultantBriefing.tsx');
const rules=read('../lib/diagnosticBriefing.ts');
const api=read('../app/api/meeting-preparation/route.ts');

test('1. remove a lista antiga e mantém apenas as respostas agrupadas',()=>{
 assert.doesNotMatch(central,/className="answer-list"/);
 assert.match(meeting,/DiagnosticResponsesGrouped/);
});

test('2. interpretações são específicas por pergunta',()=>{
 for(const text of ['Origem das oportunidades','Tempo de primeira resposta','Centralização de indicadores','Rotina de gestão'])assert.match(rules,new RegExp(text,'i'));
});

test('3. briefing apresenta tópico e interpretação da evidência',()=>{
 assert.match(briefing,/entry\.reading\.topic/);
 assert.match(briefing,/entry\.reading\.interpretation/);
});

test('4. riscos são consequências das evidências e não o parecer automático',()=>{
 assert.match(briefing,/pains\.map\(entry=>entry\.reading\.risk\)/);
 assert.doesNotMatch(briefing,/risks=.*data\.parecer/);
});

test('5. perguntas de investigação derivam das respostas frágeis',()=>{
 assert.match(briefing,/entry\.reading\.investigation/);
 assert.match(rules,/question:/);
});

test('6. hipóteses automáticas são apresentadas como conteúdo a validar',()=>{
 assert.match(briefing,/confirmação ou refutação/);
 assert.match(rules,/hypothesis:/);
});

test('7. briefing e reunião usam a mesma fonte oficial de prioridade',()=>{
 assert.match(briefing,/officialDiagnosticPriority\(data\)/);
 assert.match(meeting,/officialPriorityRanking\(data\)/);
 assert.doesNotMatch(meeting,/const priorityRanking=/);
});

test('8. prioridade principal oferece somente os eixos oficiais e Outra',()=>{
 assert.match(meeting,/priorityOptions=\['Atrair','Converter','Crescer','Outra'\]/);
});

test('9. prioridade secundária é opcional e não repete a principal',()=>{
 assert.match(meeting,/secondaryPriorityOptions=\['Nenhuma','Atrair','Converter','Crescer','Outra'\]/);
 assert.match(meeting,/option===validations\.prioridade\?\.selecionada/);
 assert.match(meeting,/disabled=\{disabled\}/);
});

test('10. API preserva as prioridades principal e secundária',()=>{
 assert.match(api,/validatedSecondaryPriority/);
 assert.match(api,/validatedPriorities/);
});

test('11. diagnósticos antigos permanecem compatíveis',()=>{
 assert.match(briefing,/Não informado/);
 assert.match(rules,/value===undefined/);
});

test('12. preparação legada não é mais renderizada junto à Voz do Cliente',()=>{
 const voice=read('../components/DiagnosticClientVoice.tsx');
 assert.doesNotMatch(voice,/diagnostic-preparation|PREPARA&#199;&#195;O DA REUNI&#195;O/);
 assert.match(voice,/VOZ DO CLIENTE/);
});
