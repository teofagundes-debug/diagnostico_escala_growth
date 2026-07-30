import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const component=await readFile(new URL('../components/ClientAreaPanel.tsx',import.meta.url),'utf8');
const central=await readFile(new URL('../components/CentralApp.tsx',import.meta.url),'utf8');

test('dossiê usa a nova Área do Cliente sem alterar a API existente',()=>{
 assert.match(central,/ClientAreaPanel as ClientAccessCard/);
 assert.match(component,/\/api\/client-access/);
 assert.doesNotMatch(component,/\/api\/growth|Motor de Crescimento/);
});

test('cards, próxima ação e timeline cobrem a jornada solicitada',()=>{
 for(const text of ['Situação do acesso','Versão publicada','Data da publicação','Primeiro acesso','Último acesso','Status da Jornada','Próxima Ação','Preparação','Área do Cliente','Aceite','Pagamento','Implantação','Método Escala Growth','Aguardando Assinatura do Contrato'])assert.ok(component.includes(text),text);
});

test('checklist usa a nova nomenclatura consultiva',()=>{
 for(const text of ['Plano Estratégico concluído','Proposta de Implantação aprovada','Financeiro configurado','Área do Cliente publicada','Primeiro acesso realizado','Proposta aceita','Contrato assinado','Pagamento confirmado','Kickoff realizado','Implantação técnica concluída','Método Escala Growth iniciado'])assert.ok(component.includes(text),text);
});

test('ações operacionais aparecem de forma progressiva',()=>{
 for(const text of ['Publicar Área do Cliente','Registrar Primeiro Acesso','Registrar Kickoff','Finalizar Implantação Técnica','Iniciar Método Escala Growth'])assert.ok(component.includes(text),text);
 assert.match(component,/journey\.paid&&!journey\.kickoff/);
 assert.match(component,/journey\.kickoff&&!journey\.implementationDone/);
 assert.match(component,/journey\.implementationDone&&!journey\.active/);
});
