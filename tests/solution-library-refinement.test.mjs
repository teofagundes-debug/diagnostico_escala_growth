import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {solutionParameters} from '../lib/motor-growth.ts';

const read=(file)=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('salvamento usa o Tipo consolidado da aba Comercial',()=>{
 const api=read('app/api/commercial/route.ts');
 assert.match(api,/const type=.*body\.tipo/);
 assert.match(api,/tipo:type/);
 assert.doesNotMatch(api,/descricao_tecnica:body\.descricao_tecnica\|\|null,tipo,classificacao_comercial/);
});

test('investimento recomendado possui aplicabilidade explícita e snapshot',()=>{
 const ui=read('components/CommercialAdmin.tsx');
 const api=read('app/api/commercial/route.ts');
 const motor=read('lib/motor-growth.ts');
 const configuration=read('components/ExecutionStrategyPanel.tsx');
 for(const source of [ui,api,motor,configuration])assert.match(source,/utiliza_investimento_recomendado/);
 assert.match(ui,/editing\.utiliza_investimento_recomendado===true&&<label className="wide">Investimento mínimo recomendado/);
 assert.match(api,/investimento_minimo_recomendado:usesRecommendedInvestment\?Number/);
});

test('campos de pendência só aparecem e são persistidos quando aplicáveis',()=>{
 const ui=read('components/CommercialAdmin.tsx');
 const api=read('app/api/commercial/route.ts');
 assert.match(ui,/editing\.gera_pendencias===true&&<div className="wide pending-default-fields">/);
 assert.match(api,/titulo_pendencia_padrao:createsPending\?/);
 assert.match(api,/codigo_pendencia_padrao:createsPending\?/);
 assert.match(api,/rota_configuracao_padrao:createsPending\?/);
});

test('Automações usa grade responsiva e migration corrige Licença Nimble',()=>{
 const ui=read('components/CommercialAdmin.tsx');
 const css=read('app/globals.css');
 const sql=read('database/migration_v51_refinamento_biblioteca_solucoes.sql');
 assert.match(ui,/automation-options/);
 assert.match(css,/\.automation-options,.pending-default-fields\{display:grid;grid-template-columns:repeat\(2/);
 assert.match(css,/@media\(max-width:650px\).*automation-options,.pending-default-fields\{grid-template-columns:1fr/);
 for(const rule of ['gera_pendencias = false','abre_planejamento_operacional = true','treinamento_obrigatorio = true','impacta_cronograma = false','cria_checklist = true'])assert.ok(sql.includes(rule),rule);
});

test('cenários funcionais preservam regras por solução',()=>{
 const nimble=solutionParameters({nome:'Licença Plataforma Nimble',tipo:'Mensalidade',utiliza_investimento_recomendado:false,investimento_minimo_recomendado:999,gera_pendencias:false,abre_planejamento_operacional:true,treinamento_obrigatorio:true,impacta_cronograma:false,cria_checklist:true});
 assert.equal(nimble.investimento_minimo_recomendado,0);
 assert.equal(nimble.gera_pendencias,false);
 assert.equal(nimble.abre_planejamento_operacional,true);
 const google=solutionParameters({nome:'Gestão Google Ads',tipo:'Mensalidade',utiliza_investimento_recomendado:true,investimento_minimo_recomendado:1500,abre_planejamento_operacional:true});
 assert.equal(google.investimento_minimo_recomendado,1500);
 const operational=solutionParameters({nome:'Implantação Operacional',tipo:'Implantação',utiliza_investimento_recomendado:false,impacta_cronograma:true});
 assert.equal(operational.investimento_minimo_recomendado,0);
 assert.equal(operational.impacta_cronograma,true);
 const whatsapp=solutionParameters({nome:'Campanhas WhatsApp',tipo:'Implantação',gera_pendencias:true,codigo_pendencia_padrao:'WHATSAPP_CAMPANHA',titulo_pendencia_padrao:'Configurar campanha de WhatsApp'});
 assert.equal(whatsapp.gera_pendencias,true);
 assert.equal(whatsapp.codigo_pendencia_padrao,'WHATSAPP_CAMPANHA');
});
