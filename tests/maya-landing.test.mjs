import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const maya=read('components/landing/MayaLandingPage.tsx');
const home=read('components/landing/LandingPage.tsx');
const tools=read('components/landing/ToolLandingPage.tsx');
const api=read('app/api/tool-implementation/route.ts');
const sitemap=read('app/sitemap.ts');

test('Maya possui página própria com posicionamento e capacidades aprovadas',()=>{
  for(const text of ['Maya – Sua assistente comercial','Uma operação comercial assistida','Atendimento contextual','Transferência com contexto','Maya Agenda','Follow-up','Reativação','Voz & Visão','Maya + equipe humana'])assert.ok(maya.includes(text));
});

test('CTAs da Maya reutilizam o diagnóstico de Implantação com origem identificada',()=>{
  assert.match(maya,/\/implantacao-ferramentas\/diagnostico\?origem=maya/);
  assert.doesNotMatch(maya,/checkout|Comprar agora|R\$\s*\d|plano mensal/i);
  assert.match(api,/searchParams\.get\('origem'\)==='maya'/);
  assert.match(api,/respostas:\{\.\.\.\(body\.answers\|\|\{\}\),\.\.\.\(origem\?\{origem\}/);
});

test('Maya aparece na Home, em Implantação e no sitemap',()=>{
  assert.match(home,/href="\/maya"/);
  assert.match(home,/maya-home-hero\.png/);
  assert.match(home,/maya-whatsapp-conversation\.png/);
  assert.match(home,/mayaWhatsappMockup[^>]+unoptimized/);
  assert.match(home,/HomeMayaVisual/);
  assert.match(home,/Exemplo ilustrativo de conversa da Maya/);
  assert.match(tools,/href: "\/maya"/);
  assert.match(sitemap,/`\$\{SITE_URL\}\/maya`/);
});
