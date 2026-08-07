import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {acquisitionReadiness,acquisitionStrategy,attractionNeed,conversionCapacity,evidenceFromAnswerMap} from '../lib/evidenceEngine.ts';

const ids=['converter-0','converter-1','converter-4','converter-2','converter-3','acompanhar-2','acompanhar-0','acompanhar-3'];
const capacity=(scores)=>conversionCapacity(evidenceFromAnswerMap(Object.fromEntries(scores.map((score,index)=>[ids[index],score]))));

test('1. oito componentes em 4 resultam em 100% e capacidade alta',()=>{const result=capacity(Array(8).fill(4));assert.equal(result.score_base,100);assert.equal(result.classification,'ALTA');assert.deepEqual(result.limiters,[])});
test('2. oito componentes em 2 resultam em 50% e capacidade média',()=>{const result=capacity(Array(8).fill(2));assert.equal(result.score_base,50);assert.equal(result.classification,'MEDIA')});
test('3. três componentes críticos limitam a capacidade a baixa',()=>{const result=capacity([1,1,1,3,3,3,3,3]);assert.equal(result.classification,'BAIXA');assert.match(result.limiters.join(' '),/Três ou mais/)});
test('4. qualificação crítica limita score matemático alto ao nível médio',()=>{const result=capacity([1,4,4,4,4,4,4,4]);assert.ok(result.score_base>=75);assert.equal(result.classification_before_limiters,'ALTA');assert.equal(result.classification,'MEDIA')});
test('5. baixa maturidade analítica reduz score sem criar limitador isolado',()=>{const result=capacity([4,4,4,0,0,4,4,4]);assert.equal(result.score_base,75);assert.equal(result.classification,'ALTA');assert.deepEqual(result.limiters,[])});
test('6. combinação de etapas, qualificação e acompanhamento críticos aciona processo frágil',()=>{const result=capacity([1,1,4,4,4,1,4,4]);assert.equal(result.fragile_process_rule,true);assert.equal(result.classification,'BAIXA');assert.match(result.limiters.join(' '),/Processo comercial básico/)});
test('7. apenas cinco componentes resultam em dados insuficientes',()=>{const result=capacity([4,4,4,4,4]);assert.equal(result.available,false);assert.equal(result.classification,null);assert.equal(result.score_base,null)});
test('8. indicadores congelados e cruzamento estratégico permanecem inalterados',()=>{const evidence=evidenceFromAnswerMap({'atrair-5':0,'atrair-6':0,'atrair-7':1,'atrair-8':2,'converter-5':1,'organizar-0':1,'organizar-1':1,'acompanhar-0':1});const readiness=acquisitionReadiness(evidence),need=attractionNeed(evidence),strategy=acquisitionStrategy(need,readiness);assert.equal(need.need_score,81);assert.equal(need.classification,'ALTA');assert.equal(readiness.classification,'BAIXA');assert.equal(strategy.status,'ESTRUTURAR PARA EXPANDIR')});
test('9. Sprint permanece analítica e não altera módulos comerciais',()=>{const source=fs.readFileSync(new URL('../lib/evidenceEngine.ts',import.meta.url),'utf8'),briefing=fs.readFileSync(new URL('../components/DiagnosticConsultantBriefing.tsx',import.meta.url),'utf8');assert.doesNotMatch(source,/CRM Comercial|Google Ads|Meta Ads|Agente de IA/);assert.match(briefing,/Capacidade de Conversão/);assert.match(briefing,/Pontos de gestão a observar/);assert.match(briefing,/Regra de processo frágil/)});
