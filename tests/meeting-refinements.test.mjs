import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('relacionamento e situação da plataforma usam o documento persistente da reunião',()=>{
 const component=read('components/MeetingPreparation.tsx'),api=read('app/api/meeting-preparation/route.ts');
 assert.match(component,/tipo_relacionamento/);
 assert.match(component,/situacao_plataforma/);
 assert.match(component,/Cliente da Base/);
 assert.match(component,/SITUAÇÃO ATUAL DA PLATAFORMA/);
 assert.match(api,/tipo_relacionamento','situacao_plataforma','situacao_plataforma_outro/);
 assert.match(api,/dados_reuniao:meetingData/);
});

test('realidade combina confirmações e respostas sem manter a etapa Ajustes',()=>{
 const component=read('components/MeetingPreparation.tsx');
 assert.match(component,/O cliente informou que \$\{answer\}/);
 assert.match(component,/confirmedRecommendations\.map/);
 assert.match(component,/confirmedGroups/);
 assert.doesNotMatch(component,/<label>Ajustes<textarea/);
});

test('validação oferece as prioridades sugeridas e usa o título consultivo',()=>{
 const component=read('components/MeetingPreparation.tsx');
 assert.match(component,/suggestedPriorityRanking\.map\(\(item:any\)=>item\.label\)/);
 assert.match(component,/priorityOptions\.map/);
 assert.match(component,/Prioridade Definida em Conjunto com o Cliente/);
});

test('campos internos não alimentam Plano Estratégico nem Portal do Cliente',()=>{
 const component=read('components/MeetingPreparation.tsx'),api=read('app/api/meeting-preparation/route.ts'),portal=read('app/api/portal/route.ts');
 assert.doesNotMatch(component,/platformSummary/);
 assert.doesNotMatch(api,/Nova oportunidade:\\n|Observações sobre a prioridade:/);
 assert.doesNotMatch(portal,/tipo_relacionamento|situacao_plataforma|situacao_plataforma_outro/);
});