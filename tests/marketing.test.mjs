import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('marketing separa UI gestao e investimento em midia',()=>{const sql=read('database/migration_v13_parametros_marketing.sql');for(const term of ['marketing_parametros','valor_gestao_mensal','google_investimento','meta_investimento','servicos_adicionais'])assert.ok(sql.includes(term))});
test('menu de marketing e exclusivo da Central Master',()=>{const central=read('components/CentralApp.tsx');assert.ok(central.includes('/central/parametros-marketing'));assert.ok(central.includes('<MarketingParameters/>'));assert.ok(read('app/api/commercial/route.ts').includes('isMaster'))});
test('portal mostra midia separada da contratacao',()=>{const portal=read('components/PortalApp.tsx');assert.ok(portal.includes('MarketingClientCard'));assert.ok(portal.includes('Esses valores'));assert.ok(portal.includes('Escala Vendas'));assert.ok(portal.includes('Por que recomendamos um investimento inicial mensal?'))});
test('resumo interno separa receita de investimentos do cliente',()=>{const central=read('components/CentralApp.tsx');assert.ok(central.includes('Receita da Escala Vendas'));assert.ok(central.includes('Investimentos do Cliente'));assert.ok(central.includes('Total mensal recomendado'))});

test('refinamentos de marketing preservam orientacao consultiva',()=>{const ui=read('components/MarketingAdmin.tsx'),sql=read('database/migration_v14_refinamento_marketing.sql');for(const term of ['uiHelp','scenario-badge','Mais utilizado','objetivo_padrao','method-note'])assert.ok(ui.includes(term));for(const value of ['1500','3000','6000','1000','2000','4000'])assert.ok(sql.includes(value))});
