import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const pixel=readFileSync(new URL('../lib/metaPixel.ts',import.meta.url),'utf8');
const landing=readFileSync(new URL('../components/acquisition/CampaignAttributionClient.tsx',import.meta.url),'utf8');
const diagnostic=readFileSync(new URL('../components/DiagnosticApp.tsx',import.meta.url),'utf8');
const home=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');

test('Pixel ausente é tolerado e script/inicialização são únicos',()=>{
 assert.match(pixel,/NEXT_PUBLIC_META_PIXEL_ID/);
 assert.match(pixel,/typeof window!==['"]undefined['"]/);
 assert.match(pixel,/getElementById\(SCRIPT_ID\)/);
 assert.match(pixel,/__escalaMetaPixelInitialized/);
});

test('Landing dispara PageView uma vez sem alterar atribuição',()=>{
 assert.match(landing,/resolveBrowserAttribution\(\);trackPageView\(\)/);
 assert.match(pixel,/escala_meta_pageview_escala_growth_v1/);
});

test('DiagnosticStarted ocorre no início efetivo e uma vez por jornada montada',()=>{
 assert.match(diagnostic,/diagnosticStartedTracked=useRef\(false\)/);
 assert.match(diagnostic,/if\(screen!==['"]quiz['"]\|\|diagnosticStartedTracked\.current\)return/);
 assert.match(diagnostic,/if\(trackDiagnosticStarted\(\)\)diagnosticStartedTracked\.current=true/);
 assert.doesNotMatch(diagnostic,/trackDiagnosticStarted\(\);setScreen\('quiz'\)/);
 assert.match(pixel,/trackCustom','DiagnosticStarted/);
 assert.match(diagnostic,/diagnosticStartedTracked\.current=false;setCompany/);
});

test('Lead só ocorre após sucesso confirmado da API e usa eventID determinístico',()=>{
 const confirmation=diagnostic.indexOf("if(!response.ok||!body.ok)throw");
 const lead=diagnostic.indexOf("trackLead(String(body.diagnostico_id||''))");
 assert.ok(confirmation>=0&&lead>confirmation);
 assert.match(pixel,/diagnostico-\$\{diagnosticId\}-lead/);
 assert.match(pixel,/content_name:'Diagnostico Escala Growth'/);
 assert.match(pixel,/\{eventID:eventId\}/);
});

test('Home institucional permanece sem integração do Pixel',()=>{
 assert.doesNotMatch(home,/metaPixel|trackPageView|fbq/);
});

test('comportamento browser inicializa e não duplica PageView ou Lead',async()=>{
 process.env.NEXT_PUBLIC_META_PIXEL_ID='1789973778843473';
 const values=new Map(),scripts=new Map();
 globalThis.sessionStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 globalThis.window={};
 globalThis.document={
  getElementById:id=>scripts.get(id)||null,
  createElement:()=>({}),
  head:{appendChild:script=>scripts.set(script.id,script)},
 };
 const tracking=await import(`../lib/metaPixel.ts?test=${Date.now()}`);
 tracking.trackPageView();tracking.trackPageView();
 tracking.trackDiagnosticStarted();
 tracking.trackLead('diagnostico-1');tracking.trackLead('diagnostico-1');
 const commands=globalThis.window.fbq.queue;
 assert.equal(commands.filter(command=>command[0]==='init').length,1);
 assert.equal(commands.filter(command=>command[1]==='PageView').length,1);
 assert.equal(commands.filter(command=>command[1]==='DiagnosticStarted').length,1);
 assert.equal(commands.filter(command=>command[1]==='Lead').length,1);
 assert.equal(commands.find(command=>command[1]==='Lead')[3].eventID,'diagnostico-diagnostico-1-lead');
 delete globalThis.window;delete globalThis.document;delete globalThis.sessionStorage;
});
