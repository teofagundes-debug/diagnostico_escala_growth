import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const diagnostic=fs.readFileSync(new URL('../lib/diagnostic.ts',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../components/DiagnosticApp.tsx',import.meta.url),'utf8');
const contextForm=fs.readFileSync(new URL('../components/DiagnosticOperationalContext.tsx',import.meta.url),'utf8');
const briefing=fs.readFileSync(new URL('../components/DiagnosticConsultantBriefing.tsx',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../database/migration_v52_diagnostico_3_briefing.sql',import.meta.url),'utf8');

test('1. novo diagnóstico contém sete perguntas avaliativas adicionais',()=>{
 for(const fragment of ['volume de novas oportunidades','geração de novas oportunidades acontece','estratégia ativa','aproveita sua base atual','primeira resposta','indicadores comerciais em um único lugar','rotina de gestão'])assert.match(diagnostic,new RegExp(fragment,'i'));
 assert.match(app,/contexto_operacional:context/);
});

test('2. diagnóstico antigo sem contexto exibe Não informado',()=>{
 assert.match(briefing,/contexto_operacional\|\|data\.relatorio_snapshot\?\.contexto_operacional\|\|\{\}/);
 assert.match(briefing,/Não informado/);
});

test('3. baixo Atrair recebe evidência Crítico',()=>assert.match(diagnostic,/value<=1\)return\{label:'Crítico'/));
test('4. baixo Converter possui interpretação específica de tempo de resposta',()=>assert.match(diagnostic,/Primeira resposta lenta ou sem padrão definido/));
test('5. baixo Crescer identifica indicadores dispersos',()=>assert.match(diagnostic,/Indicadores dispersos ou não acompanhados/));
test('6. respostas altas recebem evidência Estruturado',()=>assert.match(diagnostic,/label:'Estruturado'/));
test('7. contexto aceita múltiplos canais sem participar do cálculo',()=>{
 assert.match(diagnostic,/canais:string\[\]/);
 assert.match(contextForm,/value\.canais/);
 assert.doesNotMatch(diagnostic,/contexto_operacional.*calculateV3/);
});
test('8. opção Não sabe informar é preservada e migration é aditiva',()=>{
 assert.match(contextForm,/Não sabe informar/);
 assert.match(migration,/add column if not exists contexto_operacional/);
 assert.doesNotMatch(migration,/drop table|delete from|truncate/i);
});
