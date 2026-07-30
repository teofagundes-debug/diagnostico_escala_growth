import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const portal=read('components/PortalApp.tsx');

test('menu principal possui somente as seis áreas na ordem definida',()=>{
 const labels=['🏠 Início','📈 Painel Executivo','📋 Plano Estratégico','🚀 Evolução da Empresa','📄 Documentos','👤 Perfil'];
 let previous=-1;for(const label of labels){const current=portal.indexOf(label);assert.ok(current>previous,`${label} deve respeitar a ordem do menu`);previous=current}
 const menu=portal.match(/const menu=\[(.*?)\];/s)?.[1]||'';
 assert.equal((menu.match(/\['/g)||[]).length,6);
});

test('Home apresenta contexto, jornada e acessos rápidos',()=>{
 for(const text of ['Empresa','Consultor','Etapa atual','Próxima reunião','Resumo da jornada','Painel Executivo','Plano Estratégico','Documentos'])assert.match(portal,new RegExp(text,'i'));
 for(const stage of ['Diagnóstico','Reunião Estratégica','Plano Estratégico','Implantação','Evolução da Empresa'])assert.match(portal,new RegExp(stage));
 for(const status of ['Concluído','Em andamento','Pendente'])assert.match(portal,new RegExp(status));
 assert.match(read('app/portal/page.tsx'),/view="home"/);
});

test('Evolução da Empresa é institucional e não implementa o Motor',()=>{
 assert.ok(existsSync(new URL('../app/portal/evolucao-empresa/page.tsx',import.meta.url)));
 assert.match(portal,/Estamos preparando seu ambiente de acompanhamento contínuo/);
 assert.match(portal,/Após a conclusão da implantação esta área será liberada automaticamente/);
 assert.match(portal,/Status da implantação/);
 assert.doesNotMatch(portal,/function (Objectives|Sprints|Missions|Checklists)/);
});

test('Perfil usa a mesma proteção do Portal e páginas antigas permanecem disponíveis',()=>{
 assert.ok(existsSync(new URL('../app/portal/perfil/page.tsx',import.meta.url)));
 assert.match(read('app/portal/perfil/page.tsx'),/PortalApp view="perfil"/);
 for(const route of ['diagnostico','plano-implantacao','investimento','contrato','aceite','contratacao','evolucao','radar','documentos'])assert.ok(existsSync(new URL(`../app/portal/${route}/page.tsx`,import.meta.url)),`${route} foi preservada`);
});