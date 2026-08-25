import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const v65=readFileSync(new URL("../database/migration_v65_diagnostico_concluido_outbox.sql",import.meta.url),"utf8");
const v66=readFileSync(new URL("../database/migration_v66_atribuicao_campanhas.sql",import.meta.url),"utf8");
const v67=readFileSync(new URL("../database/migration_v67_diagnostico_concluido_atribuicao_v2.sql",import.meta.url),"utf8");
const dispatcher=readFileSync(new URL("../lib/integrationEventDispatcher.ts",import.meta.url),"utf8");
const api=readFileSync(new URL("../app/api/diagnostics/route.ts",import.meta.url),"utf8");

test("V67 redefine somente a RPC V2 e preserva V65/V66 como histórico",()=>{
  assert.match(v67,/create or replace function public\.registrar_diagnostico_growth_v2\(payload jsonb\)/);
  assert.doesNotMatch(v67,/create or replace function public\.registrar_diagnostico_growth\(payload jsonb\)/);
  assert.match(v65,/'event_version',1/);
  assert.match(v66,/Etapa 1: captura e persistência\. Não altera o payload da outbox\/Nimble/);
});

test("diagnóstico com campanha congela a atribuição persistida no mesmo evento V2",()=>{
  assert.match(v67,/d := public\.registrar_diagnostico_growth\(payload\)/);
  assert.match(v67,/insert into public\.diagnostico_atribuicoes/);
  assert.match(v67,/from public\.diagnostico_atribuicoes attribution/);
  assert.match(v67,/'version',attribution\.version/);
  assert.match(v67,/'first_touch',attribution\.first_touch/);
  assert.match(v67,/'last_touch',attribution\.last_touch/);
  assert.match(v67,/'received_at',attribution\.received_at/);
  assert.match(v67,/set event_version = 2/);
  assert.match(v67,/jsonb_set\(event\.payload,'\{event_version\}','2'::jsonb,true\)/);
  assert.match(v67,/'\{atribuicao\}',coalesce\(attribution_snapshot,'null'::jsonb\),true/);
});

test("diagnóstico direto gera V2 com atribuicao null sem inventar origem",()=>{
  assert.match(v67,/coalesce\(attribution_snapshot,'null'::jsonb\)/);
  assert.doesNotMatch(v67,/source['"]?\s*[:=]\s*['"]direct/i);
});

test("evento é localizado por identidade completa e nunca duplicado",()=>{
  assert.equal((v67.match(/insert into public\.integration_events/g)||[]).length,0);
  assert.match(v67,/event\.idempotency_key = 'diagnostico_concluido:'\|\|d/);
  assert.match(v67,/event\.aggregate_id = d/);
  assert.match(v67,/event\.event_type = 'diagnostico_concluido'/);
  assert.match(v67,/event\.status = 'PENDING'/);
});

test("falha ao atualizar exatamente um evento provoca rollback da RPC",()=>{
  assert.match(v67,/get diagnostics updated_event_count = row_count/);
  assert.match(v67,/if updated_event_count <> 1 then\s+raise exception/s);
  assert.doesNotMatch(v67,/exception\s+when/i);
});

test("eventos históricos permanecem intocados e dispatcher envia o snapshot sem transformação",()=>{
  assert.doesNotMatch(v67,/update public\.integration_events[\s\S]*where[\s\S]*(delivered_at|status\s*=\s*'DELIVERED')/i);
  assert.match(v67,/where event\.idempotency_key = 'diagnostico_concluido:'\|\|d/);
  assert.match(dispatcher,/body:JSON\.stringify\(event\.payload\)/);
  assert.doesNotMatch(dispatcher,/diagnostico_atribuicoes|event_version\s*=/);
});

test("API continua chamando a RPC V2 e só despacha depois do retorno",()=>{
  const rpcIndex=api.indexOf("registrar_diagnostico_growth_v2");
  const parseIndex=api.indexOf("const diagnostico_id=await r.json()");
  const dispatchIndex=api.indexOf("dispatchDiagnosticEvents(10)");
  assert.ok(rpcIndex>=0&&parseIndex>rpcIndex&&dispatchIndex>parseIndex);
});
