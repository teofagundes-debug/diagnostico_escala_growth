import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const form=read('components/ToolImplementationDiagnostic.tsx');
const api=read('app/api/tool-implementation/route.ts');
const migration=read('database/migration_v74_cadastro_e_evento_ferramentas.sql');
const dispatcher=read('lib/integrationEventDispatcher.ts');
const dossierApi=read('app/api/dossiers/route.ts');
const dossier=read('components/CompanyDossierExecutive.tsx');
const clientArea=read('components/ClientAreaPanel.tsx');

test('entrada de Ferramentas coleta o padrão cadastral e contratual',()=>{
 for(const field of ['nome_fantasia','cpf_cnpj','segmento','endereco','cidade','estado','cep'])assert.match(form,new RegExp(field));
 assert.match(api,/cpf_cnpj:String\(body\.cpf_cnpj\)\.replace/);
 assert.match(api,/endereco:String\(body\.endereco\)\.trim\(\)/);
});

test('RPC persiste cadastro e cria evento idempotente no mesmo fluxo',()=>{
 for(const field of ['razao_social','nome_fantasia','cpf_cnpj','segmento','endereco','cidade','estado','cep'])assert.match(migration,new RegExp(field));
 assert.match(migration,/solicitacao_ferramentas_concluida:\'\|\|p/);
 assert.match(migration,/on conflict\(idempotency_key\) do nothing/);
 assert.match(migration,/insert into public\.integration_events/);
});

test('solicitação de Ferramentas usa o mesmo outbox e dispatcher Nimble',()=>{
 assert.match(migration,/event_type in \('diagnostico_concluido','solicitacao_ferramentas_concluida'\)/);
 assert.match(dispatcher,/\['diagnostico_concluido','solicitacao_ferramentas_concluida'\]\.includes/);
 assert.match(api,/dispatchDiagnosticEvents\(10\)/);
});

test('Dossiê restrito é determinado por origem canônica e não por nome',()=>{
 assert.match(dossierApi,/toolOnly=toolProjects\.length>0&&diagnostics\.length===0/);
 assert.match(dossierApi,/customer_origin:toolOnly\?'FERRAMENTAS':'GROWTH'/);
 assert.match(dossier,/data\.customer_origin==='FERRAMENTAS'/);
 assert.match(dossier,/<ClientAreaPanel companyId=\{companyId\} company=\{company\} restricted/);
 assert.match(clientArea,/restricted=false/);
 assert.match(clientArea,/!restricted&&<><ExecutionStrategySummary/);
});
