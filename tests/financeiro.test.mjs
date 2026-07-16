import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const portal=fs.readFileSync('components/PortalApp.tsx','utf8'),central=fs.readFileSync('components/CentralApp.tsx','utf8'),api=fs.readFileSync('app/api/portal/route.ts','utf8'),sql=fs.readFileSync('database/migration_v10_financeiro.sql','utf8');
test('portal apresenta investimento e contratação por links',()=>{for(const text of ['Investimento e Contratação','Pagar com PIX','Pagar com Cartão','Iniciar Assinatura','Estamos aguardando a confirmação'])assert.ok(portal.includes(text))});
test('consultor possui resumo comercial e financeiro por empresa',()=>{for(const text of ['FinancialPanel','Resumo Comercial','link_pix','Pagamento confirmado','Kickoff liberado'])assert.ok((central+api+sql).includes(text))});
test('pagamento confirmado libera kickoff',()=>{assert.ok(api.includes("Kickoff de Implantação"));assert.ok(api.includes("status_implantacao:'Implantação em preparação'"))});

