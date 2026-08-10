
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('migration creates structural mapping with constraints and RLS',()=>{const sql=read('database/migration_v58_integracao_motor_biblioteca.sql');assert.match(sql,/create table if not exists public\.intervencao_solucoes/);assert.match(sql,/unique \(intervention_code, solucao_id\)/);assert.match(sql,/references public\.catalogo_recursos\(id\)/);assert.match(sql,/enable row level security/)});
test('3.0 pricing uses UI and canonical monthly value, never default implantation price',()=>{const source=read('lib/commercialPricingResolver.ts');assert.match(source,/ui\*unit/);assert.match(source,/solution\.valor_mensal/);assert.doesNotMatch(source,/solution\.valor_implantacao_padrao/)});
test('solution resolver deduplicates by solution id and preserves source interventions',()=>{const source=read('lib/strategicSolutionResolver.ts');assert.match(source,/grouped=new Map/);assert.match(source,/current\.source\.add\(link\.intervention_code\)/);assert.match(source,/source_interventions:source/);assert.match(source,/unmapped_interventions/)});
test('commercial bridge is master-only and does not publish or contract',()=>{const source=read('app/api/strategic-commercial/route.ts');assert.match(source,/isMaster\(req\)/);assert.doesNotMatch(source,/financeiro_growth|contratos_growth|aceites_growth|pagamentos_growth|published_snapshot/)});
test('strategic commercial API does not shadow the Web API URL constructor',()=>{const source=read('app/api/strategic-commercial/route.ts');assert.doesNotMatch(source,/const URL=process\.env\.SUPABASE_URL/);assert.match(source,/const SUPABASE_URL=process\.env\.SUPABASE_URL/);assert.match(source,/new globalThis\.URL\(req\.url\)/)});

