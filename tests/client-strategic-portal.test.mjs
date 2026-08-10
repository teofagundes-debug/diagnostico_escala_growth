import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const domain=fs.readFileSync(new URL('../lib/client-strategic-portal.ts',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../app/api/portal-strategic/route.ts',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../components/ClientStrategicView.tsx',import.meta.url),'utf8');

test('seleciona somente o plano publicado vigente',()=>{assert.match(domain,/status==='PUBLISHED'/);assert.match(domain,/version_number/);assert.match(domain,/published_snapshot/)});
test('vincula implantação pela mesma versão do plano',()=>{assert.match(domain,/item\.plan_id===plan\.id/);assert.match(domain,/item\.plan_version.*plan\.version_number/)});
test('ausência de medição não é convertida em zero',()=>{assert.match(ui,/Sem medição/);assert.doesNotMatch(ui,/latest.*\|\|0/)});
test('API isola todas as leituras pela empresa autenticada',()=>{assert.match(api,/empresa_id=eq\.\$\{company\}/);assert.match(api,/actor\.empresa_id/)});
test('portal é somente leitura e não expõe debug',()=>{assert.doesNotMatch(api,/method:\s*['"](?:POST|PATCH|DELETE)/);assert.doesNotMatch(ui,/JSON\.stringify|debug|textarea|contentEditable/i)});
test('mantém os quatro agrupamentos executivos solicitados',()=>{for(const label of ['Visão Geral','Plano Estratégico','Implantação','Evolução'])assert.match(ui,new RegExp(label))});
