import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const migration=read('database/migration_v42_versao_metodo.sql'),api=read('app/api/regeneration/route.ts'),ui=read('components/RegenerationCenter.tsx');

test('version 2.4 is centralized and stamped permanently on strategic plans',()=>{
 assert.match(migration,/metodo_growth_versoes/);assert.match(migration,/values\('2\.4'/);
 for(const field of ['metodo_nome','metodo_versao','metodo_aplicado_em'])assert.match(migration,new RegExp(field));
 assert.match(migration,/before insert on public\.planos_estrategicos/);
});

test('context compares plan version against current method version',()=>{
 assert.match(api,/planMethodVersion/);assert.match(api,/update_available/);assert.match(api,/methodVersions/);
 assert.match(ui,/Versão atual do Método/);assert.match(ui,/Atualização disponível/);assert.match(ui,/✓ Plano atualizado/);
});

test('update preview explains new and preserved content before confirmation',()=>{
 assert.match(ui,/method-update-modal/);assert.match(ui,/Novidades que serão incorporadas/);assert.match(ui,/Conteúdo preservado/);
 for(const item of ['Diagnóstico','Reunião Estratégica','Anotações','Histórico','Documentos','Parecer Final do Consultor'])assert.match(ui,new RegExp(item));
 assert.match(ui,/Cancelar/);assert.match(ui,/Atualizar Plano Estratégico/);
});

test('history records previous and new method versions with motive, user and time',()=>{
 assert.match(migration,/versao_metodo_anterior/);assert.match(migration,/versao_metodo_nova/);
 assert.match(api,/previousMethodVersion/);assert.match(api,/dossie_eventos/);
 assert.match(ui,/Histórico de Atualizações do Método/);assert.match(ui,/displayDate\(item\.created_at\)/);
});

test('active projects require explicit Master confirmation',()=>{
 assert.match(api,/executionStarted/);assert.match(api,/ACTIVE_PROJECT_CONFIRMATION/);assert.match(api,/confirm_active/);
 assert.match(ui,/Recomendamos criar um novo Projeto de Evolução/);
 assert.match(api,/isMaster\(req\)/);
});

test('all regeneration actions persist the calculated history version',()=>{
 for(const action of ['Diagnóstico','Plano Estratégico','Projeto de Evolução','Cronograma','Recomendações','Biblioteca de Soluções'])assert.match(ui,new RegExp(action));
 assert.match(api,/const version=Math\.max/);
 assert.match(api,/tipo,versao:version,metodo_versao/);
 assert.doesNotMatch(api,/tipo,versao,metodo_versao/);
});
