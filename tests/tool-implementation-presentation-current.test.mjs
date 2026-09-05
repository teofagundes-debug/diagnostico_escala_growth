import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {toolPresentationImplementationItems,toolPresentationSolutionCards} from '../lib/toolImplementation.ts';

const configuration={solutions:[{id:'AI_AGENT',name:'Agente de Inteligência Artificial'}],ai_agent:{area:'Comercial / Vendas',channels:['WhatsApp'],functions:['Qualificar contatos']}};
const catalog=[{id:'ai',nome:'Ativação e Treinamento de Agente de IA',descricao:'Descrição IA',categoria:'Inteligência Artificial',entregas_padrao:['Configuração do Agente de Inteligência Artificial']},{id:'crm',nome:'CRM Comercial',descricao:'Descrição comercial canônica do CRM.',categoria:'Gestão Comercial',entregas_padrao:['Estruturação inicial do CRM']},{id:'wpp',nome:'WhatsApp Oficial',descricao:'Descrição comercial canônica do WhatsApp.',categoria:'Canais',entregas_padrao:['Configuração do WhatsApp Oficial']}];
const item=(resource_id,nome,origens=['CONSULTOR'],quantidade=1)=>({resource_id,nome,origens,quantidade,categoria:catalog.find(resource=>resource.id===resource_id)?.categoria});

test('recurso adicionado passa a compor a solução atual',()=>{
 const cards=toolPresentationSolutionCards(configuration,[],[],[item('ai','Ativação e Treinamento de Agente de IA',['AI_AGENT']),item('crm','CRM Comercial')],catalog);
 assert.deepEqual(cards.map(card=>card.name),['Agente de Inteligência Artificial','CRM Comercial']);
 assert.equal(cards[1].description,'Descrição comercial canônica do CRM.');
});

test('dois recursos adicionados aparecem sem duplicar o recurso mapeado da IA',()=>{
 const cards=toolPresentationSolutionCards(configuration,[],[],[item('ai','Ativação e Treinamento de Agente de IA',['AI_AGENT']),item('wpp','WhatsApp Oficial'),item('crm','CRM Comercial')],catalog);
 assert.deepEqual(cards.map(card=>card.name),['Agente de Inteligência Artificial','WhatsApp Oficial','CRM Comercial']);
});

test('remoção e quantidade usam exclusivamente os itens comerciais atuais',()=>{
 const withoutCrm=toolPresentationSolutionCards(configuration,[],[],[item('ai','Ativação e Treinamento de Agente de IA',['AI_AGENT']),item('wpp','WhatsApp Oficial')],catalog);
 assert.equal(withoutCrm.some(card=>card.name==='CRM Comercial'),false);
 const quantity=toolPresentationSolutionCards(configuration,[],[],[item('crm','CRM Comercial',['CONSULTOR'],3)],catalog).find(card=>card.name==='CRM Comercial');
 assert.deepEqual(quantity?.details.find(detail=>detail.label==='Quantidade')?.value,'3');
});

test('resolução e entregáveis canônicos acompanham a solução salva',()=>{
 const process={solutions:[{id:'PROCESS_AUTOMATION',name:'Automação de Processos'}],process_automation:{summary:'Disparar notificações'}},resolutions=[{solution_type:'PROCESS_AUTOMATION',definition:'Notificar clientes',resource_name:'CRM Comercial'}];
 const cards=toolPresentationSolutionCards(process,['Automação de Processos: escopo a validar na reunião.'],resolutions,[item('crm','CRM Comercial',['PROCESS_AUTOMATION'])],catalog);
 assert.equal(cards[0].scopeStatus,null);
 assert.equal(cards[0].scopeResolution?.definition,'Notificar clientes');
 assert.ok(toolPresentationImplementationItems(configuration,[],[],[item('crm','CRM Comercial')],catalog).includes('Estruturação inicial do CRM'));
});

test('versão validada seleciona snapshot final como fonte congelada',()=>{
 const source=readFileSync(new URL('../components/ToolImplementationPresentation.tsx',import.meta.url),'utf8');
 assert.match(source,/proposal\.snapshot_final&&!\['RASCUNHO','EM_VALIDACAO'\]\.includes\(proposal\.status\)/);
 assert.match(source,/source=frozen\?proposal\.snapshot_final:proposal/);
 assert.match(source,/financial=source\.financeiro/);
});
