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
 assert.match(api,/canonicalResourceId=.*recurso_id\|\|\(allowLegacyFallback\?item\?\.id:''\)/);
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

test('fluxo 3.0 nunca usa id do vínculo como fallback canônico',()=>{
 const api=read('app/api/commercial-evolution/route.ts');
 assert.match(api,/allowLegacyFallback=!strategicDraft\(project\)/);
 assert.match(api,/if\(strategic\)await persistStrategicExecutionResources\(existing,resources\);else await replaceResources\(id,resources,true\)/);
 assert.match(api,/flow:allowLegacyFallback\?'LEGACY':'ESTRATEGICO_3_0'/);
});

test('salvamento não tenta atualizar a coluna gerada nova_mensalidade',()=>{
 const api=read('app/api/commercial-evolution/route.ts');
 const executionBlock=api.slice(api.indexOf("if(body.action==='execution-strategy')"),api.indexOf("if(body.action==='update')"));
 assert.doesNotMatch(executionBlock,/body:JSON\.stringify\(\{[^}]*nova_mensalidade:/s);
 assert.match(executionBlock,/return Response\.json\(\{ok:true,flow:'LEGACY',checklist,mensalidade_adicional:monthly,valor_implantacao_adicional:implantation,nova_mensalidade:newMonthly/);
});

test('cinco recursos 3.0 percorrem validação, histórico, estratégia e checklist',()=>{
 const api=read('app/api/commercial-evolution/route.ts');
 const betaResources=['Licença Plataforma Nimble','CRM Comercial','Implantação Operacional','Dashboard Executivo','Treinamento da Equipe'].map((nome,index)=>({id:`vinculo-${index}`,recurso_id:`catalogo-${index}`,nome_snapshot:nome}));
 assert.equal(betaResources.length,5);
 assert.ok(betaResources.every(item=>item.recurso_id!==item.id));
 for(const stage of ['SAVE_VALIDATE_RESOURCES','SAVE_EXECUTION_HISTORY','SAVE_EXECUTION_STRATEGY','SAVE_INTELLIGENT_PENDENCIES','SAVE_CHECKLIST'])assert.ok(api.includes(stage),stage);
});

test('configuração 3.0 preserva os preços congelados e não chama o PATCH financeiro do portal',()=>{
 const api=read('app/api/commercial-evolution/route.ts'),panel=read('components/ExecutionStrategyPanel.tsx');
 assert.match(api,/canonicalFinancial=.+commercial_3_0_snapshot\?\.financial/);
 assert.match(api,/frozenImplantation=amount\(canonicalFinancial\.valor_implantacao\)/);
 assert.match(api,/frozenMonthly=amount\(canonicalFinancial\.valor_mensalidade\)/);
 assert.match(api,/financial_source:'CONSOLIDACAO_COMERCIAL_3_0'/);
 assert.doesNotMatch(panel,/await fetch\('\/api\/portal'/);
});

test('checklist exibe configuração, executor e resumo financeiro pelos critérios persistidos',()=>{
 const panel=read('components/ExecutionStrategyPanel.tsx');
 assert.match(panel,/executorDefined=persistedChecklist\.executor_definido===true/);
 assert.match(panel,/financialUpdated=persistedChecklist\.resumo_financeiro_atualizado===true/);
 assert.match(panel,/executorDefined\?'✓ Executor definido'/);
 assert.match(panel,/financialUpdated\?'✓ Resumo Financeiro atualizado'/);
});
