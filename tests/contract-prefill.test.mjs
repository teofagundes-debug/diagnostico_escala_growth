import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const dossierApi=await readFile(new URL('../app/api/dossiers/route.ts',import.meta.url),'utf8');
const central=await readFile(new URL('../components/CentralApp.tsx',import.meta.url),'utf8');
const portal=await readFile(new URL('../app/api/portal/route.ts',import.meta.url),'utf8');
const contractTemplate=await readFile(new URL('../lib/contractTemplate.ts',import.meta.url),'utf8');
const migration=await readFile(new URL('../database/migration_20260803_dados_contratuais_revisados.sql',import.meta.url),'utf8');

test('prefill respeita dados revisados e usa diagnóstico antes do cadastro geral',()=>{
 assert.match(dossierApi,/dados_contratuais_revisados_em/);
 assert.match(dossierApi,/latest\?\.dados_empresa\|\|latest\?\.relatorio_snapshot\?\.empresa/);
 assert.match(dossierApi,/fromDiagnostic\|\|fromCompany/);
});

test('salvamento contratual marca a revisão persistente',()=>{
 assert.match(dossierApi,/contractFields\.some\(field=>body\[field\]!==undefined\)/);
 assert.match(migration,/add column if not exists dados_contratuais_revisados_em timestamptz/);
});

test('CPF CNPJ e CEP são formatados somente para exibição',()=>{
 assert.match(central,/contractDisplay/);
 assert.match(central,/contractValue/);
 assert.match(central,/\['cpf_cnpj','cep'\]\.includes\(key\)\?onlyDigits/);
});

test('contrato gerado continua consumindo os dados persistidos da empresa',()=>{
 assert.match(portal,/buildHomologatedContract/);
 for(const field of ['company.razao_social','company.cpf_cnpj','company.endereco','company.cidade','company.estado','company.cep'])assert.ok(contractTemplate.includes(field),field);
});
