import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const meeting=await readFile(new URL('../components/MeetingPreparation.tsx',import.meta.url),'utf8');
const plan=await readFile(new URL('../components/StrategicPlanValidation.tsx',import.meta.url),'utf8');
const dossiers=await readFile(new URL('../app/api/dossiers/route.ts',import.meta.url),'utf8');

test('preparação possui somente os quatro grupos de apoio interno',()=>{
 for(const title of ['Hipóteses levantadas pelo Diagnóstico','Perguntas sugeridas','Pontos que precisam ser validados','Oportunidades que deverão ser confirmadas'])assert.ok(meeting.includes(title),title);
 assert.match(meeting,/Preparação da Reunião <small>Uso interno<\/small>/);
});

test('preparação deixa de ser exibida quando a reunião foi concluída',()=>{
 assert.match(meeting,/record\.status==='Concluída'\|\|record\.meeting\?\.status==='Realizada'/);
 assert.match(meeting,/if\(meetingCompleted\)return <MeetingOfficialReport/);
 assert.match(meeting,/setRecord\(\(current:any\)=>\(\{\.\.\.current,status:'Concluída'/);
});

test('Relatório da Reunião Estratégica é o documento oficial da reunião',()=>{
 for(const section of ['Resumo Executivo','Realidade Atual','Evolução do Entendimento','Hipóteses Validadas','Prioridade Estratégica','Recursos Implantados','Oportunidades Confirmadas','Informações Confirmadas','Próximos Passos'])assert.ok(meeting.includes(section),section);
 assert.ok(meeting.includes('Documento oficial do Método Escala Growth'));
});

test('Plano Estratégico continua sendo validação sem repetição',()=>{
 assert.equal((plan.match(/<textarea/g)||[]).length,1);
 assert.ok(plan.includes('Parecer Final do Consultor'));
 assert.ok(plan.includes('Documento executivo automático'));
 assert.doesNotMatch(plan,/Observações Complementares/);
 assert.match(plan,/strategic-readonly/);
});

test('acervo metodológico possui somente os três documentos oficiais',()=>{
 const declaration=dossiers.match(/const documents=\[(.*?)\];const completedImplementation=/s)?.[1]||'';
 for(const document of ['Diagnóstico Escala Growth','Relatório da Reunião Estratégica','Plano Estratégico'])assert.ok(declaration.includes(document),document);
 assert.doesNotMatch(declaration,/Plano de Implantação|Preparação da Reunião/);
});
