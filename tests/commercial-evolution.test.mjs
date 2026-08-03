import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const component=readFileSync(new URL('../components/CommercialEvolutionPanel.tsx',import.meta.url),'utf8');
const api=readFileSync(new URL('../app/api/commercial-evolution/route.ts',import.meta.url),'utf8');

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
 for(const collection of ['rawVersions','rawProjects','rawCatalog','rawFinancials']){
  assert.match(api,new RegExp(`Array\\.isArray\\(${collection}\\)`));
 }
 assert.match(api,/previousResources=Array\.isArray\(previous\?\.recursos\)\?previous\.recursos:\[\]/);
 assert.match(api,/snapshot:\{project:existing,resources:projectResources\}/);
});
