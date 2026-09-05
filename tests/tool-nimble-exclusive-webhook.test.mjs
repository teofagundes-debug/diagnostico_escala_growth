import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const dispatcher=readFileSync('lib/integrationEventDispatcher.ts','utf8');
const migration=readFileSync('database/migration_v75_webhook_exclusivo_ferramentas.sql','utf8');
const route=readFileSync('app/api/tool-implementation/route.ts','utf8');

test('dispatcher separa Ferramentas do endpoint Growth',()=>{
 assert.match(dispatcher,/NIMBLE_DIAGNOSTIC_WEBHOOK_URL/);
 assert.match(dispatcher,/NIMBLE_TOOLS_WEBHOOK_URL/);
 assert.doesNotMatch(dispatcher,/ra-bcknd\.com/);
 assert.match(dispatcher,/event\.event_type==='solicitacao_ferramentas_concluida'\?NIMBLE_TOOLS_URL:NIMBLE_DIAGNOSTIC_URL/);
});

test('payload Ferramentas contém somente o contrato comercial solicitado',()=>{
 for(const field of ['origem','nome','empresa','whatsapp','email','area','solucoes','projeto_id','empresa_id','submitted_at'])assert.match(migration,new RegExp(`'${field}'`));
 for(const forbidden of ['preco','margem','snapshot','token','nimble_intent'])assert.doesNotMatch(migration,new RegExp(`'${forbidden}'`,'i'));
 assert.match(migration,/'origem','implantacao_ferramentas'/);
});

test('outbox mantém idempotência e falha externa não bloqueia resposta pública',()=>{
 const v74=readFileSync('database/migration_v74_cadastro_e_evento_ferramentas.sql','utf8');
 assert.match(v74,/'solicitacao_ferramentas_concluida:'\|\|p/);
 assert.match(v74,/on conflict\(idempotency_key\) do nothing/);
 assert.match(route,/void dispatchDiagnosticEvents\(10\)\.catch/);
 assert.ok(route.indexOf('return Response.json({ok:true')>route.indexOf('void dispatchDiagnosticEvents(10)'));
});

test('migration não altera eventos Growth nem eventos já entregues',()=>{
 assert.doesNotMatch(migration,/event_type='diagnostico_concluido'/);
 assert.match(migration,/status='PENDING'/);
 assert.doesNotMatch(migration,/status='DELIVERED'/);
});
