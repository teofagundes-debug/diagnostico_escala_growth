import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const domain=fs.readFileSync(new URL('../lib/client-strategic-portal.ts',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../app/api/portal-strategic/route.ts',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../components/ClientStrategicView.tsx',import.meta.url),'utf8');
const portal=fs.readFileSync(new URL('../components/PortalApp.tsx',import.meta.url),'utf8');

test('seleciona somente o plano publicado vigente',()=>{assert.match(domain,/status==='PUBLISHED'/);assert.match(domain,/version_number/);assert.match(domain,/published_snapshot/)});
test('vincula implantação pela mesma versão do plano',()=>{assert.match(domain,/item\.plan_id===plan\.id/);assert.match(domain,/item\.plan_version.*plan\.version_number/)});
test('ausência de medição não é convertida em zero',()=>{assert.match(ui,/Sem medição/);assert.doesNotMatch(ui,/latest.*\|\|0/)});
test('API isola todas as leituras pela empresa autenticada',()=>{assert.match(api,/empresa_id=eq\.\$\{company\}/);assert.match(api,/actor\.empresa_id/)});
test('portal é somente leitura e não expõe debug',()=>{assert.doesNotMatch(api,/method:\s*['"](?:POST|PATCH|DELETE)/);assert.doesNotMatch(ui,/JSON\.stringify|debug|textarea|contentEditable/i)});
test('mantém os quatro agrupamentos executivos solicitados',()=>{for(const label of ['Visão Geral','Plano Estratégico','Implantação','Evolução'])assert.match(ui,new RegExp(label))});
test('cenário A: preview administrativo ignora somente o bloqueio visual da etapa',()=>assert.match(portal,/!d\.methodStarted&&!d\.preview/));
test('cenário B: cliente real sem etapa liberada recebe 403 no backend',()=>{assert.match(api,/actor\.role==='cliente'/);assert.match(api,/methodStarted/);assert.match(api,/status:403/)});
test('cenário C: cliente liberado utiliza o mesmo componente e os mesmos dados',()=>{assert.match(portal,/return <ClientStrategicView\/>/);assert.equal((ui.match(/function ClientStrategicView/g)||[]).length,1)});
test('query string de empresa só é aceita para usuário Master autenticado',()=>assert.match(api,/actor\.role==='master'&&url\.searchParams\.get\('empresa'\)/));
test('responsável e prazo acordados vêm exclusivamente do snapshot publicado',()=>{assert.match(domain,/agreed_responsible:action\.responsible/);assert.match(domain,/agreed_due_date:action\.due_date/);assert.match(ui,/Responsável acordado/);assert.match(ui,/Prazo acordado/)});
test('alterações operacionais da implantação não substituem valores acordados',()=>{const planSection=ui.slice(ui.indexOf("tab==='plan'"),ui.indexOf("tab==='implementation'"));assert.doesNotMatch(planSection,/operational_responsible|operational_due_date/);assert.match(planSection,/agreed_responsible/);assert.match(planSection,/agreed_due_date/)});
test('ação sem prazo respeita horizonte especial',()=>{assert.match(ui,/Sem prazo definido/);assert.match(ui,/Sem prazo aplicável/);assert.match(ui,/QUANDO_ESTIVER_PRONTO/)});
test('prazo acordado sem horário preserva o dia no fuso brasileiro',()=>assert.match(ui,/T12:00:00/));
