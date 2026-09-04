import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../database/migration_v73_vinculo_empresa_implantacao_ferramentas.sql',import.meta.url),'utf8');
const api=readFileSync(new URL('../app/api/tool-implementation/route.ts',import.meta.url),'utf8');
const v68=readFileSync(new URL('../database/migration_v68_implantacao_ferramentas_fase1.sql',import.meta.url),'utf8');
const companiesApi=readFileSync(new URL('../app/api/companies/route.ts',import.meta.url),'utf8');
const central=readFileSync(new URL('../components/CentralApp.tsx',import.meta.url),'utf8');

test('Projeto de Ferramentas utiliza a empresa canônica compartilhada',()=>{assert.match(v68,/empresa_id uuid not null references public\.empresas/);assert.doesNotMatch(migration,/create table .*empresas_ferramentas/i)});
test('empresa existente exige identidade forte e nunca apenas nome',()=>{assert.match(migration,/EMAIL_E_WHATSAPP_EXATOS/);assert.match(migration,/EMAIL_EXATO/);assert.match(migration,/WHATSAPP_EXATO/);assert.doesNotMatch(migration,/from public\.empresas where lower\(trim\(nome\)\)/)});
test('correspondência ambígua cria empresa neutra em vez de escolher LIMIT 1',()=>{assert.match(migration,/NOVA_EMPRESA_POR_AMBIGUIDADE/);assert.match(migration,/insert into public\.empresas\(nome\)/);assert.match(migration,/empresa_vinculo_ambiguidade/)});
test('responsável é reutilizado somente dentro da empresa resolvida',()=>{assert.match(migration,/where contact\.empresa_id=e/);assert.match(migration,/where id=r and empresa_id=e/)});
test('banco impede projeto vinculado a responsável de outra empresa',()=>{assert.match(migration,/projeto_ferramentas_empresa_responsavel_guard/);assert.match(migration,/contact\.id=new\.responsavel_id and contact\.empresa_id=new\.empresa_id/)});
test('projeto, pré-proposta e evidência do vínculo nascem na mesma RPC',()=>{for(const table of ['projetos_implantacao_ferramentas','pre_propostas_implantacao','pre_propostas_implantacao_historico'])assert.match(migration,new RegExp(`insert into public\\.${table}`));assert.match(api,/rpc\/registrar_diagnostico_implantacao/)});
test('projetos antigos inconsistentes permanecem identificáveis sem backfill inseguro',()=>{assert.match(migration,/implantacao_ferramentas_vinculo_pendencias/);assert.match(migration,/RESPONSAVEL_DE_OUTRA_EMPRESA/);assert.doesNotMatch(migration,/update public\.projetos_implantacao_ferramentas set empresa_id/)});
test('ajuste não implementa a Fase 2B.1B',()=>{assert.doesNotMatch(migration,/financeiro_growth|contratos_growth|aceites_growth|pagamentos_growth|portal_usuarios|proposta_final/i)});
test('Central lista empresas canônicas mesmo sem diagnóstico Growth',()=>{assert.match(companiesApi,/rest\('empresas\?select=/);assert.match(companiesApi,/diagnostics\.filter\(\(diagnostic:any\)=>diagnostic\.empresa_id===company\.id\)/);assert.match(central,/fetch\('\/api\/companies'/);assert.match(central,/<Companies companies=\{companies\}/);assert.doesNotMatch(central,/function Companies\(\{items,/)});
