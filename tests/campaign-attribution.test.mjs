import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {
  applyCampaignTouch,
  attributionTouchFromSearch,
  authorizedTrackingSearch,
  mergeAttributionEnvelopes,
  sanitizeAttributionEnvelope,
  sanitizeAttributionTouch,
} from "../lib/campaignAttribution.ts";

const d=(value)=>new Date(value);

test("preserva first touch e atualiza somente o last non-direct touch",()=>{
  const meta=attributionTouchFromSearch("?utm_source=meta&utm_medium=paid_social&campaign_id=cmp-1",{landing_page:"/escala-growth",captured_at:"2026-08-01T10:00:00.000Z"});
  const first=applyCampaignTouch(null,meta,d("2026-08-01T10:00:00.000Z"));
  const google=attributionTouchFromSearch("?utm_source=google&utm_medium=cpc&gclid=abc",{landing_page:"/escala-growth",captured_at:"2026-08-05T10:00:00.000Z"});
  const result=applyCampaignTouch(first,google,d("2026-08-05T10:00:00.000Z"));
  assert.equal(result.first_touch.source,"meta");
  assert.equal(result.last_touch.source,"google");
  assert.equal(result.last_touch.gclid,"abc");
});

test("acesso direto e refresh não sobrescrevem nem renovam a atribuição",()=>{
  const touch=attributionTouchFromSearch("?utm_source=meta&ad_id=ad-1",{captured_at:"2026-08-01T10:00:00.000Z"});
  const first=applyCampaignTouch(null,touch,d("2026-08-01T10:00:00.000Z"));
  assert.deepEqual(applyCampaignTouch(first,null,d("2026-08-02T10:00:00.000Z")),first);
  const refresh=attributionTouchFromSearch("?utm_source=meta&ad_id=ad-1",{captured_at:"2026-08-02T10:00:00.000Z"});
  assert.deepEqual(applyCampaignTouch(first,refresh,d("2026-08-02T10:00:00.000Z")),first);
});

test("janela de 90 dias expira sem fabricar origem direta",()=>{
  const touch=attributionTouchFromSearch("?utm_source=meta",{captured_at:"2026-01-01T00:00:00.000Z"});
  const envelope={version:1,first_touch:touch,last_touch:touch};
  assert.ok(sanitizeAttributionEnvelope(envelope,d("2026-04-01T00:00:00.000Z")));
  assert.equal(sanitizeAttributionEnvelope(envelope,d("2026-04-02T00:00:00.001Z")),null);
  assert.equal(applyCampaignTouch(envelope,null,d("2026-04-02T00:00:00.001Z")),null);
});

test("merge permite continuidade por cookie/localStorage e retorno em nova aba",()=>{
  const first={version:1,first_touch:{source:"meta",captured_at:"2026-08-01T00:00:00.000Z"},last_touch:{source:"meta",captured_at:"2026-08-01T00:00:00.000Z"}};
  const last={version:1,first_touch:first.first_touch,last_touch:{source:"google",captured_at:"2026-08-03T00:00:00.000Z"}};
  const merged=mergeAttributionEnvelopes([first,last],d("2026-08-04T00:00:00.000Z"));
  assert.equal(merged.first_touch.source,"meta");
  assert.equal(merged.last_touch.source,"google");
});

test("CTA transporta somente parâmetros autorizados e sanitizados",()=>{
  const query=authorizedTrackingSearch("?utm_source=meta&campaign_id=123&email=segredo%40x.com&foo=bar");
  assert.match(query,/utm_source=meta/);
  assert.match(query,/campaign_id=123/);
  assert.doesNotMatch(query,/email|foo|segredo/);
});

test("sanitização ignora chaves desconhecidas, truncando valores e envelopes manipulados",()=>{
  const touch=sanitizeAttributionTouch({source:"meta",unknown:"x",content:"a".repeat(500),landing_page:"https://evil.test/escala-growth?token=x",referrer:"javascript:alert(1)"});
  assert.equal(touch.content.length,160);
  assert.equal(touch.unknown,undefined);
  assert.equal(touch.landing_page,"/escala-growth");
  assert.equal(touch.referrer,undefined);
  assert.equal(sanitizeAttributionEnvelope({version:999,first_touch:touch,last_touch:touch}),null);
  assert.equal(sanitizeAttributionTouch({landing_page:"/escala-growth"}),null);
});

test("migration persiste relação 1:1 atomicamente e mantém outbox Nimble v1 intacta",()=>{
  const migration=readFileSync(new URL("../database/migration_v66_atribuicao_campanhas.sql",import.meta.url),"utf8");
  const outbox=readFileSync(new URL("../database/migration_v65_diagnostico_concluido_outbox.sql",import.meta.url),"utf8");
  assert.match(migration,/diagnostico_id uuid not null unique/);
  assert.match(migration,/d := public\.registrar_diagnostico_growth\(payload\)/);
  assert.match(migration,/insert into public\.diagnostico_atribuicoes/);
  assert.match(migration,/if first_touch is not null and last_touch is not null/);
  assert.doesNotMatch(migration,/event_version|nimble_intent/);
  assert.match(outbox,/'event_version',1/);
  assert.doesNotMatch(outbox,/'atribuicao'/);
});

test("API valida no servidor e diagnóstico envia atribuição sem alterar perguntas",()=>{
  const api=readFileSync(new URL("../app/api/diagnostics/route.ts",import.meta.url),"utf8");
  const diagnostic=readFileSync(new URL("../components/DiagnosticApp.tsx",import.meta.url),"utf8");
  assert.match(api,/sanitizeAttributionEnvelope\(payload\.atribuicao\)/);
  assert.match(api,/registrar_diagnostico_growth_v2/);
  assert.match(diagnostic,/atribuicao:attribution\.envelope/);
  assert.match(diagnostic,/localStorage\.getItem\('escala-growth'/);
});
