import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {formalizationKey,resolveFormalizationContext,selectFormalizationRecord} from '../lib/formalizationContext.ts';

const sql=readFileSync(new URL('../database/migration_v71_identidade_formalizacao.sql',import.meta.url),'utf8');
const growth={id:'fg',empresa_id:'e1',origem:'ESCALA_GROWTH',origem_id:'pe1',versao:1,status:'PUBLICADA'};
const tools={id:'ft',empresa_id:'e1',origem:'IMPLANTACAO_FERRAMENTAS',origem_id:'pp1',versao:1,status:'EM_PREPARACAO'};

test('schema é aditivo, valida origem e relaciona as cinco estruturas',()=>{
 assert.match(sql,/create table if not exists public\.formalizacoes/);
 assert.match(sql,/ESCALA_GROWTH','IMPLANTACAO_FERRAMENTAS/);
 for(const table of ['proposta_publicacoes','financeiro_growth','contratos_growth','aceites_growth','pagamentos_growth'])assert.match(sql,new RegExp(`alter table public\\.${table} add column if not exists formalizacao_id`));
 assert.doesNotMatch(sql,/drop table|delete from|truncate/i);
});

test('mesma empresa pode ter duas identidades sem duplicar a mesma origem e versão',()=>{
 assert.equal(formalizationKey('ESCALA_GROWTH','pe1',1),'ESCALA_GROWTH:pe1:1');
 assert.match(sql,/formalizacoes_origem_versao_unique unique \(origem,origem_id,versao\)/);
 assert.match(sql,/financeiro_growth_formalizacao_unique/);
 assert.match(sql,/A remoção da unicidade por empresa fica para o cutover/);
});

test('ID explícito tem prioridade e isola documentos da contratação',()=>{
 const context=resolveFormalizationContext({formalizationId:'ft',companyId:'e1',formalizations:[growth,tools]});
 assert.equal(context?.formalization.id,'ft');assert.equal(context?.resolution,'EXPLICIT');
 assert.equal(selectFormalizationRecord([{id:'a',formalizacao_id:'fg'},{id:'b',formalizacao_id:'ft'}],context)?.id,'b');
});

test('origem canônica resolve sem escolher silenciosamente a última da empresa',()=>{
 assert.equal(resolveFormalizationContext({companyId:'e1',origin:'ESCALA_GROWTH',originId:'pe1',version:1,formalizations:[growth,tools]})?.formalization.id,'fg');
 assert.equal(resolveFormalizationContext({companyId:'e1',formalizations:[growth,tools]}),null);
});

test('fallback histórico Growth preserva registro sem formalizacao_id',()=>{
 const context=resolveFormalizationContext({companyId:'e1',legacyProjectId:'legacy',formalizations:[growth]});
 assert.equal(context?.resolution,'LEGACY_FALLBACK');
 assert.equal(selectFormalizationRecord([{id:'legacy',formalizacao_id:null}],context)?.id,'legacy');
});

test('formalizacao_id de outra empresa é rejeitada',()=>{
 assert.equal(resolveFormalizationContext({formalizationId:'ft',companyId:'outra',formalizations:[growth,tools]}),null);
 assert.match(sql,/foreign key\(formalizacao_id,empresa_id\)/);
});

test('backfill não associa registros ambíguos por aproximação',()=>{
 assert.match(sql,/having count\(\*\)=1/);
 assert.match(sql,/formalizacoes_backfill_pendencias/);
 assert.match(sql,/where formalizacao_id is null/);
});
