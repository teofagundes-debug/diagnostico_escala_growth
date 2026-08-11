import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('consolidação copia valores persistidos sem recalcular preços',()=>{const api=read('app/api/commercial-consolidation/route.ts');assert.match(api,/valor_implantacao:Number\(row\.valor_implantacao_adicional/);assert.match(api,/valor_mensalidade:Number\(row\.nova_mensalidade/);assert.doesNotMatch(api,/resolveCommercialPrice|valor_implantacao_padrao|valor_mensalidade_padrao/)});
test('snapshot canônico preserva recursos e parâmetros 3.0',()=>{const lib=read('lib/commercialConsolidation.ts');for(const field of ['solution_code','ui_utilizada','valor_ui_utilizado','source_interventions','parent_solution_ids','dependency_source','parametros_snapshot'])assert.match(lib,new RegExp(field))});
test('publicação exige consolidação pronta e fingerprint vigente',()=>{const route=read('app/api/client-access/route.ts');assert.match(route,/commercial_3_0_status!==['"]PRONTO['"]/);assert.match(route,/commercial_3_0_fingerprint!==currentFingerprint/);assert.match(route,/commercial_3_0:consolidated/)});
test('consolidação não cria aceite, pagamento ou formalização',()=>{const api=read('app/api/commercial-consolidation/route.ts');assert.doesNotMatch(api,/aceites_growth|pagamentos_growth|situacoes_comerciais_versoes|Formalizado/)});
test('fluxo legacy não é submetido à consolidação 3.0',()=>{const api=read('app/api/commercial-consolidation/route.ts'),publication=read('app/api/client-access/route.ts');assert.match(api,/flow:'LEGACY'/);assert.match(publication,/if\(strategic3\)/)});
