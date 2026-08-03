import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const portalApi=await readFile(new URL('../app/api/portal/route.ts',import.meta.url),'utf8');
const portal=await readFile(new URL('../components/PortalApp.tsx',import.meta.url),'utf8');
const accessApi=await readFile(new URL('../app/api/client-access/route.ts',import.meta.url),'utf8');
const accessPanel=await readFile(new URL('../components/ClientAreaPanel.tsx',import.meta.url),'utf8');

test('master visualiza dados vivos e cliente é bloqueado antes da publicação',()=>{
 assert.match(portalApi,/preview=p\.role==='master'&&!isPublished/);
 assert.match(portalApi,/p\.role==='cliente'&&!isPublished/);
 assert.ok(portalApi.includes('A Área do Cliente ainda não foi publicada.'));
});

test('portal identifica visualmente o modo de pré-visualização',()=>{
 assert.ok(portal.includes('MODO DE PRÉ-VISUALIZAÇÃO'));
 assert.ok(portal.includes('Este portal ainda não foi publicado para o cliente.'));
 assert.match(portal,/data\.preview/);
});

test('pré-visualização não executa aceite nem pagamento',()=>{
 assert.match(portal,/if\(d\.preview\)return <Document title="Aceite Eletrônico"/);
 assert.match(portal,/if\(!link\|\|d\.preview\)return/);
});

test('contrato percorre revisão publicação e aceite',()=>{
 for(const status of ['Não iniciado','Dados contratuais pendentes','Contrato em elaboração','Contrato disponível para revisão','Contrato revisado','Contrato publicado','Contrato aceito'])assert.ok(accessApi.includes(status),status);
 assert.ok(accessPanel.includes('Confirmar revisão do Contrato'));
 assert.ok(accessPanel.includes('Pré-visualizar Portal do Cliente'));
 assert.match(accessApi,/contract\.status!=='Revisado'/);
 assert.match(portalApi,/status:'Aceito'/);
});

test('pendências bloqueiam publicação mas não a pré-visualização',()=>{
 for(const text of ['Concluir o Diagnóstico','Preencher o Parecer do Consultor','Concluir o Plano Estratégico','Revisar e confirmar o Contrato','Informar ao menos um link de pagamento'])assert.ok(accessApi.includes(text),text);
 assert.match(accessPanel,/data\.preview_available/);
});
