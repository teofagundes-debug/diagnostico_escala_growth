import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../components/acquisition/AcquisitionLanding.tsx", import.meta.url), "utf8");
const showcase = readFileSync(new URL("../components/acquisition/DiagnosticResultShowcase.tsx", import.meta.url), "utf8");
const attribution = readFileSync(new URL("../components/acquisition/CampaignAttributionClient.tsx", import.meta.url), "utf8");
const metadata = readFileSync(new URL("../app/escala-growth/page.tsx", import.meta.url), "utf8");

test("landing de aquisição mantém um único objetivo de conversão", () => {
  assert.equal((page.match(/<h1/g) || []).length, 1);
  assert.equal((page.match(/<Cta /g) || []).length, 3);
  assert.equal((page.match(/<AttributionDiagnosticLink/g) || []).length + (showcase.match(/<AttributionDiagnosticLink/g) || []).length, 4);
  assert.match(attribution, /authorizedTrackingSearch\(location\.search\)/);
  assert.doesNotMatch(page, /href="\/login"/);
  assert.match(page, /Resultado imediato/);
  assert.match(page, /Diagnóstico disponível para impressão/);
});

test("landing apresenta as capturas reais do diagnóstico com ampliação acessível", () => {
  assert.match(page, /DiagnosticResultShowcase/);
  assert.doesNotMatch(page, /Exemplo de visualização/);
  assert.match(showcase, /estagio-atual\.png/);
  assert.match(showcase, /atencao-e-evolucao\.png/);
  assert.match(showcase, /plano-dinamico\.png/);
  assert.match(showcase, /aria-modal="true"/);
  assert.match(showcase, /event\.key === "Escape"/);
});

test("landing possui metadata e canonical próprios", () => {
  assert.match(metadata, /Diagnóstico Escala Growth \| Descubra os Gargalos/);
  assert.match(metadata, /https:\/\/www\.escalavendas\.com\.br\/escala-growth/);
});
