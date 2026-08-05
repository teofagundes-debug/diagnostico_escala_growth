import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const engine=await readFile(new URL('../lib/motor-growth.ts',import.meta.url),'utf8');
const api=await readFile(new URL('../app/api/commercial-evolution/route.ts',import.meta.url),'utf8');
const ui=await readFile(new URL('../components/CommercialEvolutionPanel.tsx',import.meta.url),'utf8');
const migration=await readFile(new URL('../database/migration_v39_motor_crescimento.sql',import.meta.url),'utf8');
const require=createRequire(import.meta.url),ts=require('typescript'),compiled=ts.transpileModule(engine,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,moduleUnderTest={exports:{}};
new Function('exports','module',compiled)(moduleUnderTest.exports,moduleUnderTest);

test('novo cliente recebe a Estrutura Base obrigatória definida pelo Método',()=>{
 for(const resource of ['Plataforma Nimble','WhatsApp Oficial','CRM Comercial','Dashboard Executivo','Treinamento Comercial','Implantação Operacional'])assert.ok(engine.includes(resource),resource);
 assert.match(engine,/classificacao:'Obrigatório'/);
});

test('diagnóstico define recomendações por objetivo e matriz de pesos',()=>{
 for(const objective of ['atrair','organizar','converter','crescer'])assert.ok(engine.includes(objective+':['),objective);
 for(const resource of ['Gestão Google Ads','Gestão Meta Ads','Landing Page','Campanhas WhatsApp','Estratégia Comercial Digital'])assert.ok(engine.includes(resource),resource);
 assert.match(engine,/GROWTH_WEIGHTS/);
 assert.match(engine,/Gatilho automático de aquisição/);
});

test('cliente da base não recebe novamente recursos ativos',()=>{
 assert.match(engine,/baseClient\?\[\]:BASE/);
 assert.match(engine,/filter\(item=>!has\(activeResources,item.nome\)\)/);
 assert.match(api,/relationship==='Cliente da Base'/);
});

test('consultor visualiza as três fases e obrigatórios ficam bloqueados',()=>{
 for(const phase of ['Estrutura Obrigatória','Recomendações Estratégicas','Evoluções Futuras'])assert.ok(ui.includes(phase)||engine.includes(phase),phase);
 assert.match(ui,/disabled=\{item.classificacao==='Obrigatório'\}/);
 assert.match(ui,/Motor de Crescimento 1.0/);
});

test('classificação e rastreabilidade são persistidas no projeto',()=>{
 for(const column of ['classificacao','origem','peso','fase']){assert.ok(api.includes(column));assert.ok(migration.includes(column))}
 assert.match(migration,/Obrigatório','Recomendado','Opcional/);
});

test('cenário Escala Vendas combina base obrigatória e prioridade Atrair',()=>{
 const names=['Licença Plataforma Nimble','WhatsApp Oficial','CRM Comercial','Dashboard Executivo','Treinamento da Equipe','Implantação Operacional','Gestão Google Ads','Gestão Meta Ads','Landing Page Institucional','Campanhas WhatsApp','Estratégia Comercial Digital'];
 const catalog=names.map((nome,index)=>({id:String(index+1),nome,tipo:'Implantação'})),result=moduleUnderTest.exports.composeGrowthProject({catalog,priority:'Atrair',baseClient:false,signals:{possui_marketing:false,possui_agencia:false,realiza_campanhas:false}});
 assert.equal(result.mandatory.length,6);
 assert.deepEqual(result.strategic.slice(0,5).map(item=>item.nome),['Gestão Google Ads','Gestão Meta Ads','Landing Page Institucional','Campanhas WhatsApp','Estratégia Comercial Digital']);
 assert.equal(result.schedule.length,3);
});
