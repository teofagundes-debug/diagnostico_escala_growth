import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../lib/evolution-management.ts',import.meta.url),'utf8'),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};vm.runInNewContext(js,{module,exports:module.exports,Object,String,Array,Number});
const{compareEvolution,measurementTimeline,normalizeEvolutionIndicators}=module.exports;
const migration=fs.readFileSync(new URL('../database/migration_v56_evolucao_ieg.sql',import.meta.url),'utf8'),correction=fs.readFileSync(new URL('../database/migration_v57_correcao_valores_evolucao.sql',import.meta.url),'utf8'),api=fs.readFileSync(new URL('../app/api/strategic-evolution/route.ts',import.meta.url),'utf8');
const item=(baseline,current,key='IEG')=>({indicator_key:key,indicator_label:key,baseline_value:baseline,current_value:current});

test('A: Implantacao sem medicao permanece com historico vazio',()=>assert.deepEqual(Array.from(measurementTimeline([])),[]));
test('B: primeira medicao e criada por funcao transacional',()=>{assert.match(migration,/create_strategic_evolution_measurement/);assert.match(migration,/insert into public\.strategic_evolution_measurements/);assert.match(migration,/insert into public\.strategic_evolution_measurement_items/)});
test('C: baseline e capturado do diagnostico e protegido contra update',()=>{assert.match(migration,/diag\.pontuacao_geral/);assert.match(migration,/resultados_pilares/);assert.match(migration,/before update on public\.strategic_evolution_measurements/)});
test('D: segunda medicao cria novo registro e nao atualiza a primeira',()=>{assert.doesNotMatch(api,/strategic_evolution_measurements[^'\n]*method:'PATCH'/);assert.doesNotMatch(api,/strategic_evolution_measurement_items[^'\n]*method:'PATCH'/)});
test('E: comparacao com baseline e correta',()=>assert.deepEqual({...compareEvolution(49,61)},{variation:12,situation:'IMPROVED'}));
test('F: timeline compara com a medicao anterior',()=>{const timeline=measurementTimeline([{id:'1',measured_at:'2026-08-01',items:[item(49,61)]},{id:'2',measured_at:'2026-09-01',items:[item(49,64)]}]);assert.equal(timeline[1].previous_reading[0].variation,3)});
test('G: indicador melhorou',()=>assert.equal(compareEvolution(50,51).situation,'IMPROVED'));
test('H: indicador permaneceu estavel',()=>assert.equal(compareEvolution(50,50).situation,'STABLE'));
test('I: indicador piorou',()=>assert.equal(compareEvolution(50,49).situation,'WORSENED'));
test('J: ausencia de dado nao vira zero',()=>{assert.deepEqual({...compareEvolution(50,null)},{variation:null,situation:'NO_DATA'});assert.deepEqual({...compareEvolution(undefined,0)},{variation:null,situation:'NO_DATA'})});
test('K: Implantacao concluida continua referenciada com delete restrict',()=>assert.match(migration,/implementation_id uuid not null references public\.strategic_plan_implementations\(id\) on delete restrict/));
test('L: Plano e snapshot permanecem imutaveis',()=>{assert.doesNotMatch(api,/strategic_execution_plans[^'\n]*method:'PATCH'/);assert.doesNotMatch(api,/published_snapshot[^'\n]*method:'PATCH'/)});
test('M: diagnostico original permanece imutavel',()=>{assert.doesNotMatch(api,/diagnosticos[^'\n]*method:'PATCH'/);assert.match(migration,/diagnostic_id uuid not null references public\.diagnosticos\(id\) on delete restrict/)});
test('camada reutiliza calculo gerencial da Sprint 10.2',()=>assert.match(api,/implementationManagement/));

test('regressao real preserva numeros, zero e campo vazio em contrato explicito',()=>{
 const indicators=normalizeEvolutionIndicators({'IEG':'42','PILAR:Atrair':'25','PILAR:Organizar':'55','PILAR:Acompanhar':'50','PILAR:Converter':'40','PILAR:Crescer':'','PILAR:Zero':'0'});
 assert.deepEqual(JSON.parse(JSON.stringify(indicators)),[{indicator_code:'IEG',value:42},{indicator_code:'PILAR:Atrair',value:25},{indicator_code:'PILAR:Organizar',value:55},{indicator_code:'PILAR:Acompanhar',value:50},{indicator_code:'PILAR:Converter',value:40},{indicator_code:'PILAR:Crescer',value:null},{indicator_code:'PILAR:Zero',value:0}]);
 assert.match(api,/received_indicators/);assert.match(api,/persisted_items/);assert.match(correction,/entry\.value->>'indicator_code'=indicator_code/);assert.match(correction,/current_json='null'::jsonb/);
});

test('cenario de homologacao calcula 3 melhoras, 1 estavel, 1 piora e 1 sem medicao',()=>{
 const baseline={'IEG':36,'PILAR:Atrair':19,'PILAR:Organizar':55,'PILAR:Acompanhar':55,'PILAR:Converter':33,'PILAR:Crescer':18},current={'IEG':42,'PILAR:Atrair':25,'PILAR:Organizar':55,'PILAR:Acompanhar':50,'PILAR:Converter':40,'PILAR:Crescer':null};
 const reading=Object.keys(baseline).map(key=>compareEvolution(baseline[key],current[key]));
 assert.equal(reading.filter(x=>x.situation==='IMPROVED').length,3);assert.equal(reading.filter(x=>x.situation==='STABLE').length,1);assert.equal(reading.filter(x=>x.situation==='WORSENED').length,1);assert.equal(reading.filter(x=>x.situation==='NO_DATA').length,1);
 assert.deepEqual({...compareEvolution(36,42)},{variation:6,situation:'IMPROVED'});
});
