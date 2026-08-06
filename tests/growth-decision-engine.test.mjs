import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrowthProject} from '../lib/motor-growth.ts';

const names=['Plataforma Nimble','WhatsApp Oficial','CRM Comercial','Dashboard Executivo','Treinamento Comercial','Implantação Operacional','Gestão Google Ads','Gestão Meta Ads','Landing Page Institucional','Campanhas WhatsApp','CRM Avançado','Integrações','Automações','Cadência Comercial','Agente de IA','Qualificação','Business Intelligence','Indicadores','Reuniões de Evolução'];
const marketing=['Gestão Google Ads','Gestão Meta Ads','Landing Page Institucional','Campanhas WhatsApp'];
const catalog=names.map((nome,index)=>({id:String(index+1),codigo:`SOL-${index+1}`,nome,ativo:true,tipo:'Implantação',classificacao_comercial:index<6?'Obrigatória':'Opcional',criterios_recomendacao:marketing.includes(nome)?['atrair','lead','campanha','oportunidade']:nome.includes('CRM')?['organizar','centralizadas']:[],gera_pendencias:nome==='CRM Comercial',codigo_pendencia_padrao:nome==='CRM Comercial'?'CRM_PIPELINE':null,titulo_pendencia_padrao:nome==='CRM Comercial'?'Definir Pipeline Comercial':null}));

test('Atrair sem Marketing recommends acquisition structure from diagnostic evidence',()=>{
 const result=composeGrowthProject({catalog,priority:'Organizar',signals:{pillarScores:{Atrair:25,Organizar:70,Acompanhar:65,Converter:60,Crescer:55},questionScores:[{pilar:'Atrair',pergunta:'Sua empresa sabe de quais canais vêm as oportunidades?',valor:1}],openAnswers:[{pergunta:'Maior desafio',resposta:'Precisamos gerar mais leads e saber qual campanha traz oportunidades.'}],possui_marketing:false,possui_agencia:false,realiza_campanhas:false}});
 assert.equal(result.objective,'atrair');
 for(const expected of ['Gestão Google Ads','Gestão Meta Ads','Landing Page Institucional','Campanhas WhatsApp'])assert.ok(result.strategic.some(item=>item.nome===expected),expected);
});

test('meeting validation overrides diagnostic priority and removes rejected solution',()=>{
 const result=composeGrowthProject({catalog,priority:'Atrair',signals:{pillarScores:{Atrair:20,Converter:40},meetingPriority:'Converter',approvedRecommendations:['Agente de IA'],removedRecommendations:['Cadência Comercial']}});
 assert.equal(result.objective,'converter');
 assert.ok(result.strategic.some(item=>item.nome==='Agente de IA'));
 assert.ok(!result.all.some(item=>item.nome==='Cadência Comercial'));
});

test('mandatory structure, strategic recommendations and intelligent pendencies stay separated',()=>{
 const result=composeGrowthProject({catalog,signals:{pillarScores:{Organizar:25},questionScores:[{pilar:'Organizar',pergunta:'As conversas ficam centralizadas?',valor:0}]}});
 assert.ok(result.mandatory.every(item=>item.classificacao==='Obrigatório'));
 assert.ok(result.strategic.every(item=>item.classificacao==='Recomendado'));
 assert.ok(result.pendencies.some(item=>item.codigo==='CRM_PIPELINE'));
});
