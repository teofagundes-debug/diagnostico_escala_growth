import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('persiste executor e preserva histórico das decisões',()=>{
 const sql=read('database/migration_v45_estrategia_execucao.sql');
 const phaseSql=read('database/migration_v46_configuracoes_implantacao.sql');
 assert.match(sql,/executor_dados jsonb/i);
 assert.match(sql,/estrategia_execucao_historico/i);
 assert.match(phaseSql,/implantar_nesta_fase boolean/i);
 assert.match(phaseSql,/investimento_recomendado numeric/i);
 assert.match(phaseSql,/investimento_aprovado numeric/i);
});

test('só cria configuração de marketing para execução Escala Vendas',()=>{
 const api=read('app/api/commercial-evolution/route.ts');
 assert.match(api,/item\.implantar_nesta_fase===true&&item\.executor==='Escala Vendas'/);
 assert.match(api,/action==='execution-strategy'/);
});

test('expõe a decisão de fase, os três executores e a visão do cliente',()=>{
 const panel=read('components/ExecutionStrategyPanel.tsx');
 const portal=read('components/PortalApp.tsx');
 for(const executor of ['Escala Vendas','Parceiro do Cliente','Equipe Interna do Cliente'])assert.match(panel,new RegExp(executor));
 assert.match(panel,/Será implantado nesta fase/);
 assert.match(panel,/Investimento recomendado pelo Método/);
 assert.match(panel,/Investimento aprovado para esta fase/);
 assert.match(portal,/Estratégia de Execução/);
});

test('configurações ficam no Projeto de Implantação e o Dossiê recebe somente resumo',()=>{
 const central=read('components/CentralApp.tsx');
 const dossier=read('components/ClientAreaPanel.tsx');
 assert.match(central,/ExecutionStrategyPanel companyId=\{data\.empresa_id\} embedded/);
 assert.doesNotMatch(dossier,/ExecutionStrategyPanel/);
 assert.match(dossier,/ExecutionStrategySummary/);
});
