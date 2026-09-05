import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync('lib/contractTemplate.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const module=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const base={company:{razao_social:'Cliente Ltda',cpf_cnpj:'123',endereco:'Rua A',cidade:'Cidade',estado:'SP',cep:'00000'},responsible:{nome:'Pessoa',email:'pessoa@example.com'},provider:{razao_social:'Escala Vendas Ltda',cnpj:'456'},commercialParameters:{reajuste_indice:'IPCA',desconto_pix:10},resources:[{nome:'Agente de IA'},{nome:'WhatsApp Oficial'},{nome:'CRM Comercial'}],scope:[{definicao:'Configurar atendimento e automações'}],financial:{valor_implantacao:2000,valor_mensalidade:150,prazo_contratual:12}};

test('Ferramentas reutiliza todas as cláusulas homologadas com objeto específico',()=>{
 const content=module.buildHomologatedContract({origin:'IMPLANTACAO_FERRAMENTAS',...base});
 for(let clause=1;clause<=13;clause++)assert.match(content,new RegExp(`${clause}\\.`));
 for(const text of ['Implantação de Ferramentas','Agente de IA','WhatsApp Oficial','CRM Comercial','R$ 2.000,00','R$ 150,00','12 meses','Configurar atendimento e automações'])assert.ok(content.includes(text),text);
 for(const forbidden of ['Método Escala Growth','Diagnóstico Growth','Plano Estratégico','Projeto de Evolução','Reunião Estratégica'])assert.doesNotMatch(content,new RegExp(forbidden));
});

test('Growth preserva seu objeto e as cláusulas comuns homologadas',()=>{
 const content=module.buildHomologatedContract({origin:'ESCALA_GROWTH',...base});
 assert.match(content,/O cliente contrata o Método Escala Growth, o Plano Estratégico, o Plano de Implantação/);
 assert.match(content,/10\. Renovação Automática/);
 assert.match(content,/antecedência mínima de 5 \(cinco\) dias corridos/);
 assert.doesNotMatch(content,/Condições da formalização:/);
});

test('publicação persiste contrato e snapshot pela formalizacao_id',()=>{
 const api=readFileSync('app/api/client-access/route.ts','utf8');
 assert.match(api,/buildHomologatedContract\(\{origin:'IMPLANTACAO_FERRAMENTAS'/);
 assert.match(api,/formalizacao_id:formalization\.id/);
 assert.match(api,/rest\('contratos_growth'/);
 assert.match(api,/buildToolPortalSnapshot\(\{proposal,financial:financialPayload,contract/);
});
