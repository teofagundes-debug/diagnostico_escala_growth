import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const api=await readFile(new URL('../app/api/client-access/route.ts',import.meta.url),'utf8');
const panel=await readFile(new URL('../components/ClientAreaPanel.tsx',import.meta.url),'utf8');
const evolution=await readFile(new URL('../app/api/commercial-evolution/route.ts',import.meta.url),'utf8');

test('publicação reconhece e valida o Projeto de Evolução e o Contrato/Termo',()=>{
 assert.match(api,/projetos_evolucao\?empresa_id/);
 assert.match(api,/contratos_growth\?empresa_id/);
 assert.ok(api.includes('Preparar um Projeto de Evolução em Rascunho'));
 assert.ok(api.includes('Prepare o Contrato/Termo para continuar.'));
 assert.match(api,/usesAdhesionTerm\(project\)\?contractFieldsComplete\(company\):contract/);
});

test('uma versão publicada contém todos os documentos oficiais',()=>{
 for(const field of ['financial','plan','implementation','project','contract','orientacoes_iniciais'])assert.match(api,new RegExp(field));
 assert.match(api,/projeto_evolucao_id:project\.id/);
 assert.match(api,/status:'Publicado'/);
});

test('painel apresenta checklist e próxima ação do fluxo integrado',()=>{
 for(const text of ['Projeto de Evolução preparado','Contrato/Termo preparado','Área pronta para publicação','Aguardando formalização','Iniciar implantação','Publicação e Acesso'])assert.ok(panel.includes(text),text);
 assert.ok(panel.includes('O cliente visualizará somente:'));
});

test('formalização exige pagamento somente quando aplicável',()=>{
 assert.match(evolution,/existing\.exige_pagamento/);
 assert.ok(evolution.includes('Confirme o pagamento antes da formalização deste projeto.'));
});
