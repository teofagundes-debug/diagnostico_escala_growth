import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const api=readFileSync(new URL('../app/api/meeting-preparation/route.ts',import.meta.url),'utf8');
const component=readFileSync(new URL('../components/MeetingPreparation.tsx',import.meta.url),'utf8');
const migration=readFileSync(new URL('../database/migration_v27_campos_internos_reuniao.sql',import.meta.url),'utf8');

test('campos internos possuem colunas permanentes e backfill seguro',()=>{
 assert.match(migration,/consultant_initial_hypothesis text/);
 assert.match(migration,/prepared_specific_questions text/);
 assert.match(migration,/where source\.reuniao_id=r\.id/);
});

test('API salva, confirma e recarrega os dois campos pela reunião',()=>{
 assert.match(api,/update\.consultant_initial_hypothesis=body\.hipotese_inicial/);
 assert.match(api,/update\.prepared_specific_questions=body\.perguntas_especificas/);
 assert.match(api,/O banco não confirmou a persistência dos campos internos/);
 assert.match(api,/meeting\.consultant_initial_hypothesis/);
 assert.match(api,/meeting\.prepared_specific_questions/);
});

test('interface aguarda carregamento e possui autosave isolado por reunião',()=>{
 assert.match(component,/savedInternal=useRef/);
 assert.match(component,/reuniao_id:meetingId/);
 assert.match(component,/setTimeout\(async\(\)=>/);
 assert.match(component,/setAutoStatus\('Salvo'\)/);
 assert.doesNotMatch(component,/Preparação não iniciada|Prontidão da Reunião/);
});
