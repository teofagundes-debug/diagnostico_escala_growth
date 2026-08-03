import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';

const portal=await readFile(new URL('../components/PortalApp.tsx',import.meta.url),'utf8');
const api=await readFile(new URL('../app/api/portal/route.ts',import.meta.url),'utf8');

test('menu e rota expõem o onboarding comercial publicado',()=>{
 for(const item of ['Plano Estratégico','Projeto de Evolução','Contrato ou Termo','Aceite','Evolução da Empresa','Documentos'])assert.ok(portal.includes(item),item);
 assert.ok(existsSync(new URL('../app/portal/projeto-evolucao/page.tsx',import.meta.url)));
 assert.match(portal,/view==='projeto-evolucao'\?<ProjectEvolution/);
});

test('Home apresenta formalização e próxima ação do cenário Votecoski',()=>{
 assert.ok(portal.includes('Revise o Projeto de Evolução e o Termo de Adesão. Depois, realize o aceite para iniciar o Método Escala Growth.'));
 for(const text of ['Status da formalização','Visualizar Plano Estratégico','Visualizar Projeto de Evolução','Realizar Aceite'])assert.ok(portal.includes(text),text);
});

test('Projeto de Evolução não expõe observações internas',()=>{
 for(const field of ['valor_implantacao_adicional','mensalidade_atual','mensalidade_adicional','nova_mensalidade','forma_cobranca','formalizacao'])assert.ok(portal.includes(field),field);
 const projectComponent=portal.slice(portal.indexOf('function ProjectEvolution'),portal.indexOf('function CompanyEvolution'));
 assert.doesNotMatch(projectComponent,/observacoes_internas|checklist|criado_por/);
});

test('API usa a versão publicada e calcula as três fases',()=>{
 assert.match(api,/publishedSnapshot\?\.project/);
 for(const field of ['noAdditionalPayment','formalizationStatus','methodStarted'])assert.ok(api.includes(field),field);
 assert.match(api,/project\?\.status==='Formalizado'/);
});

test('aceite sem cobrança adicional não exige pagamento',()=>{
 assert.match(api,/if\(!noAdditionalPayment\)await advanceJourney/);
 assert.match(portal,/d\.noAdditionalPayment\?'\/portal':'\/portal\/contratacao'/);
 assert.ok(portal.includes('Não existe novo pagamento para este Projeto de Evolução. A cobrança recorrente vigente será mantida.'));
});

test('documentos incluem projeto termo e comprovante de aceite',()=>{
 assert.ok(api.includes("tipo:'Projeto de Evolução'"));
 assert.ok(api.includes("tipo:'Comprovante do aceite'"));
 assert.match(api,/titulo:project\?\.formalizacao/);
});
