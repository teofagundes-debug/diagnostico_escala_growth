import assert from 'node:assert/strict';
import test from 'node:test';
import {mappedResourceRequests,priceToolResources,toolCommercialSnapshot,toolCommercialTotals,validateToolScopeResolutions} from '../lib/toolCommercialPricing.ts';

const catalog=[
 {id:'crm',codigo:'CRM-001',nome:'CRM',categoria:'Operação',tipo:'Implantação + Mensalidade',ui:2,valor_mensal:100,ativo:true},
 {id:'ia',codigo:'IA-001',nome:'Agente de IA',categoria:'Automação',tipo:'Implantação + Mensalidade',ui:3,valor_mensal:200,ativo:true},
 {id:'aut',codigo:'AUT-001',nome:'Automações',categoria:'Automação',tipo:'Implantação',ui:1,ativo:true},
 {id:'wpp',codigo:'WPP-001',nome:'WhatsApp Oficial',categoria:'Comunicação',tipo:'Mensalidade',ui:0,valor_mensal:50,ativo:true},
];
const mappings=[
 {solution_type:'CRM',recurso_id:'crm',condition_type:'ALWAYS',quantidade_padrao:1,unidade_comercial:'unidade'},
 {solution_type:'AI_AGENT',recurso_id:'ia',condition_type:'ALWAYS',quantidade_padrao:1,unidade_comercial:'agente'},
 {solution_type:'AI_AGENT',recurso_id:'wpp',condition_type:'CHANNEL',condition_value:'WhatsApp',quantidade_padrao:1,unidade_comercial:'canal'},
 {solution_type:'SERVICE_AUTOMATION',recurso_id:'aut',condition_type:'ALWAYS',quantidade_padrao:1,unidade_comercial:'automação'},
 {solution_type:'SERVICE_AUTOMATION',recurso_id:'wpp',condition_type:'CHANNEL',condition_value:'WhatsApp',quantidade_padrao:1,unidade_comercial:'canal'},
];
const priced=(configuration,previous=[],refresh=false)=>priceToolResources(mappedResourceRequests(configuration,mappings),catalog,350,previous,refresh);

test('A: CRM usa recurso canônico, quantidade e dois impactos',()=>{const items=priced({solutions:[{id:'CRM'}]});assert.equal(items[0].codigo,'CRM-001');assert.deepEqual(toolCommercialTotals(items),{investimento_inicial:700,licencas_mensais:100})});
test('B: IA e atendimento compartilham uma única licença WhatsApp',()=>{const items=priced({solutions:[{id:'AI_AGENT'},{id:'SERVICE_AUTOMATION'}],ai_agent:{channels:['WhatsApp']},service_automation:{channels:['WhatsApp']}});assert.equal(items.filter(item=>item.codigo==='WPP-001').length,1);assert.deepEqual(items.find(item=>item.codigo==='WPP-001').origens.sort(),['AI_AGENT','SERVICE_AUTOMATION'])});
test('C: CRM, IA e atendimento somam implantação e recorrência',()=>{const items=priced({solutions:[{id:'CRM'},{id:'AI_AGENT'},{id:'SERVICE_AUTOMATION'}]});assert.deepEqual(toolCommercialTotals(items),{investimento_inicial:2100,licencas_mensais:300})});
test('D/E: processo e integração sem mapeamento não inventam preço',()=>{assert.deepEqual(priced({solutions:[{id:'PROCESS_AUTOMATION'},{id:'SYSTEM_INTEGRATION'}]}),[])});
test('F/G/H: adicionar, remover e alterar quantidade recalcula',()=>{let items=priceToolResources([{resource_id:'crm',quantity:1}],catalog,350);items=priceToolResources([...items.map(item=>({resource_id:item.resource_id,quantity:item.quantidade})),{resource_id:'ia',quantity:1}],catalog,350,items);assert.equal(toolCommercialTotals(items).investimento_inicial,1750);items=items.filter(item=>item.resource_id!=='ia');items=priceToolResources([{resource_id:'crm',quantity:2}],catalog,350,items);assert.deepEqual(toolCommercialTotals(items),{investimento_inicial:1400,licencas_mensais:200})});
test('I: snapshot validado preserva preço até atualização explícita',()=>{const old=priced({solutions:[{id:'CRM'}]}),changed=catalog.map(item=>item.id==='crm'?{...item,ui:9,valor_mensal:999}:item),request=[{resource_id:'crm',quantity:1}];assert.deepEqual(priceToolResources(request,changed,500,old,false),old);const refreshed=priceToolResources(request,changed,500,old,true);assert.equal(refreshed[0].subtotal_implantacao,4500);assert.equal(refreshed[0].subtotal_mensal,999);assert.equal(toolCommercialSnapshot(old,{valor_ui:350}).totals.investimento_inicial,700)});
test('escopo exige definição, recurso presente e quantidade',()=>{const items=priced({solutions:[{id:'CRM'}]});assert.equal(validateToolScopeResolutions(['SYSTEM_INTEGRATION'],[],items).valid,false);assert.equal(validateToolScopeResolutions(['SYSTEM_INTEGRATION'],[{solution_type:'SYSTEM_INTEGRATION',definition:'Integrar cobrança do ERP',resource_id:'missing',quantity:1}],items).valid,false);assert.equal(validateToolScopeResolutions(['SYSTEM_INTEGRATION'],[{solution_type:'SYSTEM_INTEGRATION',definition:'Integrar cobrança do ERP',resource_id:'crm',quantity:1}],items).valid,true)});
test('dois escopos exigem duas resoluções reais',()=>{const items=priced({solutions:[{id:'CRM'}]}),one=[{solution_type:'SYSTEM_INTEGRATION',definition:'Integração definida',resource_id:'crm',quantity:1}];const result=validateToolScopeResolutions(['SYSTEM_INTEGRATION','PROCESS_AUTOMATION'],one,items);assert.equal(result.valid,false);assert.match(result.errors.join(' '),/PROCESS_AUTOMATION/)});
