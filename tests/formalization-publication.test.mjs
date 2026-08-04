import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const api=read('app/api/client-access/route.ts');
const portalApi=read('app/api/portal/route.ts');
const panel=read('components/ClientAreaPanel.tsx');
const onboarding=read('components/PortalOnboarding.tsx');

test('Termo de Adesão substitui o contrato como documento válido',()=>{
 assert.match(api,/formalizationDocumentReady/);
 assert.match(api,/usesAdhesionTerm\(project\)/);
 assert.match(api,/contractFieldsComplete\(company\)/);
 assert.match(api,/contract\|\|\{titulo:documentType,status:'Publicado',tipo:'Termo de Adesão'/);
 assert.match(api,/contract\?rest\(`contratos_growth/);
});

test('checklist marca automaticamente o tipo do documento',()=>{
 assert.match(api,/label:'Contrato\/Termo preparado',done:documentReady,detail:documentReady\?documentType/);
 assert.match(panel,/Tipo: \{item\.detail\}/);
});

test('cenário sem pagamento não bloqueia publicação',()=>{
 assert.match(api,/noAdditionalPayment=Boolean/);
 assert.match(api,/label:'Pagamento',done:Boolean\(noAdditionalPayment/);
 assert.match(onboarding,/Nenhuma ação financeira necessária\. Sua cobrança recorrente permanece inalterada\./);
});

test('Portal publica Contrato/Termo sem rascunhos',()=>{
 assert.match(portalApi,/tipo:'Contrato\/Termo'/);
 assert.match(onboarding,/Visualizar Contrato\/Termo/);
 assert.doesNotMatch(onboarding,/Rascunho/);
});
