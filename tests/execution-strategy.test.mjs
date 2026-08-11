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
 assert.match(panel,/Investimento mínimo recomendado/);
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

test('histórico usa o recurso canônico da Biblioteca e não o id do vínculo',()=>{
 const api=read('app/api/commercial-evolution/route.ts');
 assert.match(api,/canonicalResourceId=.*recurso_id\|\|item\?\.id/);
 assert.match(api,/validateCatalogResources\(project,resources,'projeto_evolucao_recursos\.recurso_id'\)/);
 assert.match(api,/catalogo_recursos\?id=in\./);
 assert.doesNotMatch(api,/const recursoId=item\.id\|\|item\.recurso_id/);
 assert.doesNotMatch(api,/recurso_id:item\.id\|\|item\.recurso_id/);
});

test('painel envia o recurso_id persistido junto das configurações',()=>{
 const panel=read('components/ExecutionStrategyPanel.tsx');
 assert.match(panel,/project\.projeto_evolucao_recursos\.map/);
 assert.match(panel,/choices\[item\.recurso_id\]/);
 assert.match(panel,/action:'execution-strategy'/);
});

test('falha de persistência não conclui visualmente as configurações',()=>{
 const panel=read('components/ExecutionStrategyPanel.tsx');
 assert.match(panel,/persistedChecklist=dirty\?\{\}:\(project\.checklist\|\|\{\}\)/);
 assert.match(panel,/configured=configurationSaved/);
 assert.match(panel,/if\(!response\.ok\)/);
 assert.match(panel,/setDirty\(false\)/);
});

test('recurso inválido é bloqueado antes da FK e não expõe PostgreSQL ao consultor',()=>{
 const api=read('app/api/commercial-evolution/route.ts');
 assert.match(api,/class InvalidCatalogResourceError/);
 assert.match(api,/status:422/);
 assert.match(api,/console\.error\('\[commercial-evolution\] recurso canônico inválido'/);
 assert.doesNotMatch(api,/throw new Error\(`Recurso inválido para a Estratégia de Execução/);
});
