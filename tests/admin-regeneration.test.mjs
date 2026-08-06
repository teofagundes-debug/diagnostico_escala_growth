import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const api=read('app/api/regeneration/route.ts');
const ui=read('components/RegenerationCenter.tsx');
const central=read('components/CentralApp.tsx');
const migration=read('database/migration_v40_central_regeneracao.sql');

test('central is exclusive to Master and exposed in the administrative menu',()=>{
 assert.match(api,/isMaster\(req\)/);
 assert.match(api,/Acesso exclusivo do Usuário Master/);
 assert.match(central,/Ferramentas Administrativas/);
 assert.match(central,/\/central\/regeneracao/);
});

test('offers every regeneration action and the strategic plan options',()=>{
 for(const label of ['Regenerar Diagnóstico','Atualizar para a Versão Atual do Método','Regenerar Projeto de Evolução','Regenerar Cronograma','Atualizar Recomendações','Atualizar Biblioteca de Soluções'])assert.match(ui,new RegExp(label));
 for(const option of ['Atualizar Cronograma','Atualizar Recomendações','Atualizar Biblioteca de Soluções','Manter Parecer Final do Consultor','Gerar novo Parecer utilizando IA'])assert.match(ui,new RegExp(option));
});

test('preserves source records and writes immutable versions, comparison and history',()=>{
 assert.doesNotMatch(api,/diagnosticos\?[^'`]*method:\s*'DELETE'/);
 assert.doesNotMatch(api,/reunioes_estrategicas\?[^'`]*method:\s*'DELETE'/);
 assert.match(api,/plano_estrategico_versoes/);
 assert.match(api,/regeneracoes_metodo/);
 assert.match(api,/dossie_eventos/);
 assert.match(api,/Parecer final preservado/);
 assert.match(api,/novos_recursos/);
 assert.match(api,/novas_recomendacoes/);
});

test('migration records version metadata and snapshots',()=>{
 for(const field of ['motivo','metodo_versao','versao_anterior','versao_nova','comparacao'])assert.match(migration,new RegExp(field));
 assert.match(migration,/unique\(empresa_id,tipo,versao\)/);
 assert.match(migration,/perfil='master'/);
});

test('Escala Vendas scenario uses method 2.3, current schedule, mandatory structure and preserved opinion',()=>{
 assert.match(api,/METHOD_VERSION_FALLBACK='2\.6'/);
 assert.match(api,/createSchedule\(ctx\.motor\)/);
 assert.match(api,/ctx\.motor\.mandatory/);
 assert.match(api,/ctx\.motor\.strategic/);
 assert.match(api,/body\.manter_parecer===false\?null:previous\.parecer_consultor/);
});
