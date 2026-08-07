import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');

test('respostas abertas são persistidas junto com a conclusão do diagnóstico',()=>{
 assert.match(read('components/DiagnosticApp.tsx'),/respostas_abertas:openQuestions\.map/);
 assert.match(read('database/migration_v8_dossie_empresa.sql'),/jsonb_array_elements\(payload->'respostas_abertas'\)/);
});

test('API administrativa entrega respostas abertas sem depender de reunião',()=>{
 const api=read('app/api/diagnostics/route.ts');
 assert.match(api,/respostas_abertas\(\*\)/);
 assert.doesNotMatch(api,/respostas_abertas.*Reunião Realizada/);
});

test('análise mostra Voz do Cliente antes do parecer e preserva a resposta literal',()=>{
 const central=read('components/CentralApp.tsx'),voice=read('components/DiagnosticClientVoice.tsx');
 assert.match(central,/DiagnosticClientVoice answers=\{list\(data\.respostas_abertas\)\}/);
 assert.ok(central.indexOf('<DiagnosticClientVoice')<central.indexOf('<h3>Parecer do consultor'));
 assert.match(voice,/>VOZ DO CLIENTE</);
 assert.match(voice,/\{item\.resposta\|\|''\}/);
 assert.doesNotMatch(voice,/PREPARA&#199;&#195;O DA REUNI&#195;O|diagnostic-preparation/);
});

test('anotações da preparação usam o campo persistente da reunião sem interface concorrente',()=>{
 const meeting=read('components/MeetingPreparation.tsx'),api=read('app/api/meeting-preparation/route.ts'),voice=read('components/DiagnosticClientVoice.tsx'),portal=read('app/api/portal/route.ts');
 assert.match(meeting,/perguntas_especificas/);
 assert.match(meeting,/value=\{record\.perguntas_especificas\|\|''\}/);
 assert.match(api,/prepared_specific_questions=body\.perguntas_especificas/);
 assert.doesNotMatch(voice,/ANOTA&#199;&#213;ES DO CONSULTOR|diagnostic-notes/);
 assert.doesNotMatch(portal,/prepared_specific_questions|perguntas_especificas/);
});
