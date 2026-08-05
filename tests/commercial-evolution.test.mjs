import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const component=readFileSync(new URL('../components/CommercialEvolutionPanel.tsx',import.meta.url),'utf8');
const api=readFileSync(new URL('../app/api/commercial-evolution/route.ts',import.meta.url),'utf8');
const portalApi=readFileSync(new URL('../app/api/portal/route.ts',import.meta.url),'utf8');

test('situação comercial envia os recursos selecionados com nome explícito',()=>{
 assert.match(component,/const recursosAtivosSelecionados=/);
 assert.match(component,/recursos:recursosAtivosSelecionados/);
 assert.doesNotMatch(component,/empresa_id:companyId,recursos\}/);
});

test('tela normaliza listas ausentes antes de renderizar o histórico',()=>{
 assert.match(component,/catalog:list\(payload\.catalog\)/);
 assert.match(component,/history:list\(payload\.history\)/);
 assert.match(component,/projects:list\(payload\.projects\)/);
 assert.match(component,/active=list\(situation\?\.recursos\)/);
});

test('API devolve listas vazias e formalização aceita situação sem recursos',()=>{
 for(const [normalized,raw] of [['versions','rawVersions'],['projects','rawProjects'],['catalog','rawCatalog'],['financials','rawFinancials']])assert.ok(api.includes(`${normalized}=array(${raw})`));
 assert.match(api,/previousResources=array\(previous\?\.recursos\)/);
 assert.match(api,/snapshot:\{project:existing,resources:projectResources\}/);
});

test('governança implementa o ciclo oficial e protege a exclusão',()=>{
 for(const status of ['Rascunho','Publicado','Aceito','Formalizado','Cancelado'])assert.ok(component.includes(status));
 assert.match(api,/existing\.status!=='Rascunho'/);
 assert.match(api,/Este projeto possui histórico oficial vinculado e não pode ser excluído/);
 assert.match(api,/action==='publish'/);
 assert.match(api,/action==='cancel-publication'/);
});

test('duplicidade de rascunho exige decisão explícita do consultor',()=>{
 assert.match(api,/code:'DUPLICATE_DRAFT'/);
 for(const action of ['Continuar editando','Criar novo mesmo assim','Cancelar'])assert.ok(component.includes(action));
});

test('interface adapta recursos e preenche a adesão ao Método',()=>{
 assert.match(component,/const adhesionDefaults=/);
 assert.match(component,/typeMode\.include/);
 assert.match(component,/typeMode\.remove/);
 assert.ok(component.includes('Estrutura do Projeto: Obrigatória + Recomendações Estratégicas + Expansões'));
 assert.ok(component.includes('Recursos que deixarão de fazer parte do contrato'));
});

test('promoção exige aceite documentação e checklist',()=>{
 for(const field of ['contrato_aceito','documentacao_formalizada','checklist_concluido'])assert.ok(api.includes(field));
 assert.ok(component.includes('Promover após formalização'));
 assert.ok(component.includes('Concluir checklist'));
 assert.match(portalApi,/status:'Aceito'/);
 assert.match(portalApi,/projeto_evolucao_id:publishedProject\?\.id/);
});
