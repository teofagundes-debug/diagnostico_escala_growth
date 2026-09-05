import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');

test('login compartilhado usa identidade institucional Escala Vendas',()=>{
 const login=read('app/login/page.tsx');
 assert.match(login,/Bem-vindo à Central Escala Vendas/);
 assert.match(login,/Uma visão centralizada para acompanhar empresas, projetos, soluções e oportunidades/);
 assert.doesNotMatch(login,/Bem-vindo à Central Escala Growth/);
});

test('documentos resolvem o eyebrow pela origem canônica recebida do Portal',()=>{
 const portal=read('components/PortalApp.tsx');
 assert.match(portal,/customer_origin==='FERRAMENTAS'\?'Implantação de Ferramentas':'Método Escala Growth'/);
 for(const component of ['Proposta Comercial','Contrato\/Termo de Implantação de Ferramentas','Aceite da Proposta Comercial','Documentos'])assert.match(portal,new RegExp(component));
 assert.match(portal,/eyebrow=\{serviceEyebrow\(d\)\}/);
});

test('proposta padroniza somente labels e apresenta recursos como itens visuais',()=>{
 const portal=read('components/PortalApp.tsx'),css=read('app/globals.css');
 assert.match(portal,/tools\?'Investimento inicial':'Investimento de Implantação'/);
 assert.match(portal,/tools\?'Licenças de uso':'Mensalidade Escala Growth'/);
 assert.match(portal,/className="contracted-resources"/);
 assert.match(css,/\.contracted-resources span/);
});

test('contrato vazio é compacto e contrato existente preserva conteúdo integral',()=>{
 const portal=read('components/PortalApp.tsx'),css=read('app/globals.css');
 const contract=portal.match(/function Contract\([\s\S]*?\nfunction Acceptance/)?.[0]||'';
 assert.match(portal,/content\?<p className="contract-copy">\{content\}<\/p>:<div className="contract-empty">/);
 assert.match(portal,/Contrato em preparação/);
 assert.match(css,/\.contract-copy\{min-height:0\}/);
 assert.doesNotMatch(contract,/\.slice\(|\.substring\(/);
});

test('ajuste não altera handlers de aceite, pagamento ou não renovação',()=>{
 const portal=read('components/PortalApp.tsx');
 assert.match(portal,/action:'accept'/);
 assert.match(portal,/action:'payment_started'/);
 assert.match(portal,/action:'non_renewal'/);
 assert.match(portal,/Solicitar Não Renovação do Contrato/);
});
