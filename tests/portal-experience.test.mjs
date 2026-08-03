import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const portal=read('components/PortalApp.tsx');

test('menu principal acompanha a fase de formalização',()=>{
 const labels=['🏠 Início','📋 Plano Estratégico','🚀 Projeto de Evolução','📑 Contrato ou Termo','✅ Aceite','📈 Painel Executivo','🌱 Evolução da Empresa','📄 Documentos','👤 Perfil'];
 let previous=-1;for(const label of labels){const current=portal.indexOf(label);assert.ok(current>previous,`${label} deve respeitar a ordem do menu`);previous=current}
});

test('Home apresenta contexto formalização jornada e próxima ação',()=>{
 for(const text of ['Empresa','Consultor','Etapa atual','Próxima reunião','Resumo da jornada','Próxima ação','Projeto de Evolução','Contrato ou Termo','Aceite','Formalização'])assert.match(portal,new RegExp(text,'i'));
 for(const status of ['Concluído','Disponível','Aguardando confirmação','Não aplicável','Pendente'])assert.match(portal,new RegExp(status));
 assert.match(read('app/portal/page.tsx'),/view="home"/);
});

test('Evolução da Empresa permanece bloqueada antes do Método',()=>{
 assert.ok(existsSync(new URL('../app/portal/evolucao-empresa/page.tsx',import.meta.url)));
 assert.match(portal,/Esta área será liberada após a conclusão da formalização e o início do Método Escala Growth/);
 assert.match(portal,/if\(!d\.methodStarted\)/);
 assert.doesNotMatch(portal,/function (Objectives|Sprints|Missions|Checklists)/);
});

test('Perfil preserva proteção e páginas anteriores continuam disponíveis',()=>{
 assert.ok(existsSync(new URL('../app/portal/perfil/page.tsx',import.meta.url)));
 assert.match(read('app/portal/perfil/page.tsx'),/PortalApp view="perfil"/);
 for(const route of ['diagnostico','plano-implantacao','investimento','contrato','aceite','contratacao','evolucao','radar','documentos','projeto-evolucao'])assert.ok(existsSync(new URL(`../app/portal/${route}/page.tsx`,import.meta.url)),`${route} foi preservada`);
});
