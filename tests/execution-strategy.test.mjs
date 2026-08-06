import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('persiste executor e preserva histórico das decisões',()=>{
 const sql=read('database/migration_v45_estrategia_execucao.sql');
 assert.match(sql,/executor_dados jsonb/i);
 assert.match(sql,/estrategia_execucao_historico/i);
});

test('só cria configuração de marketing para execução Escala Vendas',()=>{
 const api=read('app/api/commercial-evolution/route.ts');
 assert.match(api,/resources\.filter\(\(item:any\)=>item\.executor==='Escala Vendas'\)/);
 assert.match(api,/action==='execution-strategy'/);
});

test('expõe as quatro opções e a visão do cliente',()=>{
 const panel=read('components/ExecutionStrategyPanel.tsx');
 const portal=read('components/PortalApp.tsx');
 for(const executor of ['Escala Vendas','Parceiro do Cliente','Equipe Interna do Cliente','Não executar neste momento'])assert.match(panel,new RegExp(executor));
 assert.match(portal,/Estratégia de Execução/);
});
