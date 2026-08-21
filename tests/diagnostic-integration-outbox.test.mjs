import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {retryDelaySeconds} from '../lib/integrationEventDispatcher.ts';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('migration cria outbox idempotente no mesmo fluxo transacional do diagnóstico',()=>{
  const sql=read('database/migration_v65_diagnostico_concluido_outbox.sql');
  assert.match(sql,/create table if not exists public\.integration_events/);
  assert.match(sql,/idempotency_key text not null unique/);
  assert.match(sql,/create or replace function public\.registrar_diagnostico_growth/);
  assert.match(sql,/insert into public\.integration_events/);
  assert.match(sql,/'diagnostico_concluido:'\|\|d/);
  assert.match(sql,/on conflict\(idempotency_key\) do nothing/);
  assert.ok(sql.indexOf('insert into public.diagnosticos')<sql.indexOf('insert into public.integration_events'));
});

test('payload da outbox nasce de registros persistidos e contém contrato Nimble esperado',()=>{
  const sql=read('database/migration_v65_diagnostico_concluido_outbox.sql');
  for(const token of ['persisted_company','persisted_contact','persisted_diagnostic','resultados_pilares','relatorio_snapshot','diagnostico_realizado','Diagnóstico','create_contact_if_missing','create_deal_if_missing'])assert.match(sql,new RegExp(token));
  assert.match(sql,/'whatsapp',coalesce\(persisted_contact\.telefone,''\)/);
  assert.match(sql,/'event_type','diagnostico_concluido'/);
});

test('claim usa SKIP LOCKED e recupera processamento abandonado',()=>{
  const sql=read('database/migration_v65_diagnostico_concluido_outbox.sql');
  assert.match(sql,/for update skip locked/);
  assert.match(sql,/status = 'PROCESSING' and locked_at < now\(\) - interval '5 minutes'/);
  assert.match(sql,/revoke all on function public\.claim_integration_events/);
});

test('dispatcher utiliza URL apenas do ambiente, timeout e registra entrega ou retry',()=>{
  const source=read('lib/integrationEventDispatcher.ts');
  assert.match(source,/process\.env\.NIMBLE_DIAGNOSTIC_WEBHOOK_URL/);
  assert.doesNotMatch(source,/ra-bcknd\.com/);
  assert.match(source,/AbortSignal\.timeout/);
  assert.match(source,/status:'DELIVERED'/);
  assert.match(source,/status:'PENDING'/);
  assert.match(source,/last_http_status/);
  assert.match(source,/delivered_at/);
  assert.deepEqual([1,2,3,4,5].map(retryDelaySeconds),[60,300,900,3600,3600]);
});

test('endpoint de despacho exige Master ou segredo de servidor',()=>{
  const source=read('app/api/integrations/diagnostic-dispatch/route.ts');
  assert.match(source,/INTEGRATION_DISPATCH_SECRET/);
  assert.match(source,/isMaster\(req\)/);
  assert.match(source,/dispatchDiagnosticEvents/);
});

test('conclusão tenta despachar após a RPC sem transformar falha da Nimble em falha do diagnóstico',()=>{
  const source=read('app/api/diagnostics/route.ts');
  const rpc=source.indexOf('rpc/registrar_diagnostico_growth');
  const dispatch=source.indexOf('void dispatchDiagnosticEvents');
  const success=source.indexOf('return Response.json({ok:true,diagnostico_id}');
  assert.ok(rpc>=0&&dispatch>rpc&&success>dispatch);
  assert.match(source,/dispatchDiagnosticEvents\(10\)\.catch/);
});
