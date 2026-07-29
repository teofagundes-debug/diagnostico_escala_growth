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
 assert.match(central,/DiagnosticClientVoice diagnosticId=\{data\.id\} answers=\{list\(data\.respostas_abertas\)\}/);
 assert.ok(central.indexOf('<DiagnosticClientVoice')<central.indexOf('<h3>Parecer do consultor'));
 assert.match(voice,/>VOZ DO CLIENTE</);
 assert.match(voice,/\{item\.resposta\|\|''\}/);
 assert.match(voice,/PREPARA&#199;&#195;O DA REUNI&#195;O/);
});

test('anotações do consultor usam armazenamento isolado e API exclusiva do Master',()=>{
 const migration=read('database/migration_v38_anotacoes_consultor.sql'),api=read('app/api/diagnostic-notes/route.ts'),voice=read('components/DiagnosticClientVoice.tsx'),portal=read('app/api/portal/route.ts');
 assert.match(migration,/diagnostico_anotacoes_consultor/);
 assert.match(migration,/diagnostico_id uuid not null unique/);
 assert.match(api,/isMaster/);
 assert.match(voice,/ANOTA&#199;&#213;ES DO CONSULTOR/);
 assert.match(voice,/className="admin-section consultant-diagnostic-notes no-print"/);
 assert.doesNotMatch(portal,/diagnostico_anotacoes_consultor/);
});
