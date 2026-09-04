import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {financialMutationPath,modernFinancialPayload,resolveFinancialContext} from '../lib/financialContext.ts';

const migration=readFileSync(new URL('../database/migration_v72_financeiro_por_formalizacao.sql',import.meta.url),'utf8');
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const formals=[{id:'growth',empresa_id:'e',origem:'ESCALA_GROWTH',origem_id:'project',versao:1,status:'PUBLICADA'},{id:'tools',empresa_id:'e',origem:'IMPLANTACAO_FERRAMENTAS',origem_id:'proposal',versao:1,status:'PRONTA'}];
const rows=[{id:'fg',empresa_id:'e',formalizacao_id:'growth',link_pix:'growth'},{id:'ft',empresa_id:'e',formalizacao_id:'tools',link_pix:'tools'}];

test('formalização explícita vence ordem e isola o financeiro Growth',()=>{const result=resolveFinancialContext({companyId:'e',financials:[...rows].reverse(),formalizations:formals,formalizationId:'growth'});assert.equal(result?.financial?.id,'fg');assert.equal(financialMutationPath(result.financial),'financeiro_growth?id=eq.fg')});
test('Projeto de Evolução resolve a formalização Growth correspondente',()=>{assert.equal(resolveFinancialContext({companyId:'e',financials:rows,formalizations:formals,projectEvolutionId:'project'})?.financial?.id,'fg')});
test('financeiro de Ferramentas nunca é escolhido no contexto Growth',()=>{assert.equal(resolveFinancialContext({companyId:'e',financials:rows,formalizations:formals})?.financial?.id,'fg')});
test('duas formalizações Growth sem identidade explícita permanecem ambíguas',()=>{const duplicated=[...formals,{...formals[0],id:'growth-2',origem_id:'project-2',versao:2}];assert.equal(resolveFinancialContext({companyId:'e',financials:rows,formalizations:duplicated}),null)});
test('novo projeto sem formalização não reutiliza financeiro moderno de outro projeto',()=>{assert.equal(resolveFinancialContext({companyId:'e',financials:[rows[0]],formalizations:[formals[0]],projectEvolutionId:'new-project'}),null)});
test('fallback histórico único permanece explícito',()=>{const legacy={id:'old',empresa_id:'e',formalizacao_id:null};const result=resolveFinancialContext({companyId:'e',financials:[legacy],formalizations:[]});assert.equal(result?.financial?.id,'old');assert.equal(result?.legacy,true)});
test('fallback histórico ambíguo não escolhe uma linha por ordem',()=>{const result=resolveFinancialContext({companyId:'e',financials:[{id:'old-1',empresa_id:'e',formalizacao_id:null},{id:'old-2',empresa_id:'e',formalizacao_id:null}],formalizations:[]});assert.equal(result?.financial,null);assert.equal(result?.resolution,'LEGACY_AMBIGUOUS')});
test('write moderno exige formalizacao_id',()=>{assert.equal(modernFinancialPayload({empresa_id:'e'},'growth').formalizacao_id,'growth');assert.throws(()=>modernFinancialPayload({empresa_id:'e'},''))});
test('migration remove unicidade por empresa sem bloquear múltiplos legados nulos',()=>{assert.match(migration,/drop constraint if exists financeiro_growth_empresa_id_key/);assert.match(migration,/unique index financeiro_growth_formalizacao_unique/);assert.match(migration,/create index if not exists financeiro_growth_legado_empresa_idx/);assert.doesNotMatch(migration,/unique index if not exists financeiro_growth_legado/);assert.match(migration,/financeiro_growth_formalizacao_empresa_guard/)});
test('consumidores Growth usam o resolvedor central e não fazem upsert por empresa',()=>{for(const path of ['app/api/meeting-preparation/route.ts','app/api/commercial-consolidation/route.ts','app/api/commercial-evolution/route.ts','app/api/client-access/route.ts','app/api/portal/route.ts']){const code=source(path);assert.match(code,/financialContext/);assert.doesNotMatch(code,/financeiro_growth\?on_conflict=empresa_id/);assert.doesNotMatch(code,/financeiro_growth\?empresa_id=.*limit=1/)}});
