import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
test('interface troca checkbox por resolução estruturada',()=>{const ui=read('components/ToolImplementationAdmin.tsx');assert.match(ui,/Resolver escopo/);assert.match(ui,/Escopo definido na reunião/);assert.match(ui,/Utilizar recurso já incluído na solução/);assert.match(ui,/Confirmar escopo/);assert.match(ui,/Escopo validado na reunião/);assert.doesNotMatch(ui,/resolved_scope_solution_ids/)});
test('backend valida resolução real e congela no snapshot',()=>{const api=read('app/api/tool-implementation/route.ts');assert.match(api,/validateToolScopeResolutions/);assert.match(api,/resolucoes_escopo:resolutions/);assert.match(api,/scope_resolutions:resolutions/);assert.match(api,/status==='VALIDADA'&&!scopeValidation.valid/)});
test('migration é aditiva e não avança para a fase 2B',()=>{const sql=read('database/migration_v70_resolucoes_escopo_ferramentas.sql');assert.match(sql,/add column if not exists resolucoes_escopo jsonb/);assert.doesNotMatch(sql,/contratos|aceites|portal|pagamentos/)});
test('botões comunicam claramente as três etapas',()=>{const ui=read('components/ToolImplementationAdmin.tsx');assert.match(ui,/Salvar alterações/);assert.match(ui,/Iniciar validação com cliente/);assert.match(ui,/Concluir validação da solução/)});
