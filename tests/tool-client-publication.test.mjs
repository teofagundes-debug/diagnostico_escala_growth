import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript'),source=fs.readFileSync(new URL('../lib/toolClientPublication.ts',import.meta.url),'utf8'),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
vm.runInNewContext(js,{module,exports:module.exports,require});
const {latestValidatedToolProposal,toolProposalFinancial,buildToolPortalSnapshot}=module.exports;

test('seleciona a versão comercial validada mais recente',()=>{
 const proposal=latestValidatedToolProposal([{id:'project',pre_propostas_implantacao:[{id:'v1',versao:1,status:'VALIDADA'},{id:'draft',versao:3,status:'RASCUNHO'},{id:'v2',versao:2,status:'FORMALIZACAO_ENVIADA'}]}]);
 assert.equal(proposal.id,'v2'); assert.equal(proposal.project.id,'project');
});

test('snapshot do Portal preserva valores congelados da proposta',()=>{
 const proposal={id:'p1',versao:2,status:'VALIDADA',snapshot_final:{financeiro:{investimento_inicial:1500,licencas_mensais:930,condicoes:'12 meses'},itens_comerciais:[{id:'crm',nome:'CRM'}]}};
 const values=toolProposalFinancial(proposal); assert.equal(values.valor_implantacao,1500); assert.equal(values.valor_mensalidade,930); assert.equal(values.condicoes,'12 meses');
 const snapshot=buildToolPortalSnapshot({proposal,financial:{status:'Portal publicado'},contract:{titulo:'Termo'},version:1,publishedAt:'2026-09-04T00:00:00Z'});
 assert.equal(snapshot.flow,'IMPLANTACAO_FERRAMENTAS'); assert.equal(snapshot.proposal.resources.length,1); assert.equal(snapshot.financial.valor_implantacao,1500); assert.equal(snapshot.financial.valor_mensalidade,930);
});
