import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const migration=read('database/migration_v41_pendencias_inteligentes.sql');
const rules=read('lib/intelligent-pendencies.ts');
const evolutionApi=read('app/api/commercial-evolution/route.ts');
const evolutionUi=read('components/CommercialEvolutionPanel.tsx');
const marketingApi=read('app/api/commercial/route.ts');
const regenerationApi=read('app/api/regeneration/route.ts');
const clientAccess=read('app/api/client-access/route.ts');
const portal=read('components/PortalApp.tsx');
const css=read('app/globals.css');

test('Motor recommends products, configurations and next actions',()=>{
 const motor=read('lib/motor-growth.ts');
 assert.match(motor,/pendencies/);assert.match(motor,/nextActions/);assert.match(motor,/motorPendingDefinitions\(all\)/);
});

test('Atrair creates one consolidated Marketing configuration pendency',()=>{
 for(const solution of ['Google Ads','Meta Ads','Landing Page','Campanhas WhatsApp','Estratégia Comercial Digital'])assert.match(rules,new RegExp(solution));
 assert.equal((rules.match(/codigo:'MARKETING_PARAMETROS'/g)||[]).length,1);
 assert.match(rules,/Configurar Parâmetros de Marketing/);
});

test('project persists and renders intelligent pendencies automatically',()=>{
 assert.match(migration,/unique \(projeto_evolucao_id, codigo\)/);
 assert.match(evolutionApi,/syncPendencies/);assert.match(evolutionApi,/pendingDefinitions/);
 assert.doesNotMatch(evolutionApi,/select=tipo_relacionamento,situacao_plataforma/);
 assert.match(evolutionUi,/Pendências do Projeto/);assert.match(evolutionUi,/Configurar/);
});

test('regeneration synchronizes Marketing recommendations with the Evolution Project',()=>{
 assert.match(regenerationApi,/syncGrowthProject/);
 assert.match(regenerationApi,/pendingDefinitions\(array\(motor\.strategic\)\)/);
 assert.match(regenerationApi,/codigo:marketing\.codigo/);
 assert.match(regenerationApi,/rota_configuracao:marketing\.rota/);
 assert.match(regenerationApi,/status:completed\?'Concluída':'Pendente'/);
 assert.match(regenerationApi,/project_sync:projectSync/);
});

test('saving existing Marketing parameters concludes the linked pendency',()=>{
 assert.match(marketingApi,/codigo=eq\.MARKETING_PARAMETROS/);
 assert.match(marketingApi,/status:'Concluída'/);
 assert.match(marketingApi,/concluida_em/);assert.match(marketingApi,/dados_configuracao/);
});

test('Marketing pendency opens the existing module and displays both checklist states',()=>{
 assert.match(evolutionUi,/\?empresa=\$\{companyId\}&projeto=\$\{project\.id\}/);
 assert.match(evolutionUi,/Parâmetros de Marketing configurados/);
 assert.match(marketingApi,/concluida_por:'Usuário Master'/);
});

test('operational checklist warns but permits publication by Master confirmation',()=>{
 assert.match(clientAccess,/INTELLIGENT_PENDENCIES/);
 assert.match(clientAccess,/confirm_pendencies/);
 assert.match(clientAccess,/Existem recomendações de Marketing sem parâmetros definidos\./);
 assert.match(read('components/ClientAreaPanel.tsx'),/Pendências Inteligentes/);
});

test('client strategy and finance keep media investment separate',()=>{
 assert.match(portal,/Estratégia de Aquisição/);
 assert.match(portal,/não fazem parte da mensalidade da Escala Vendas/);
 assert.match(read('components/CentralApp.tsx'),/Investimentos do Cliente/);
});

test('fixed administrative sidebar has independent scrolling',()=>{
 assert.match(css,/\.central>aside nav\{flex:1;min-height:0;overflow-y:auto/);
 assert.match(css,/\.central>aside>button\{flex:0 0 auto/);
});
