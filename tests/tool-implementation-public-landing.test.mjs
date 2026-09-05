import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const page=read('app/implantacao-ferramentas/page.tsx');
const landing=read('components/landing/ToolLandingPage.tsx');
const diagnostic=read('components/ToolImplementationDiagnostic.tsx');

test('landing pública usa o fluxo real de Implantação de Ferramentas',()=>{
 assert.match(page,/ToolLandingPage/);
 assert.match(landing,/const questionnaire = "\/implantacao-ferramentas\/diagnostico"/);
 assert.doesNotMatch(landing,/href="\/diagnostico"/);
});

test('landing apresenta serviços, processo, modelo comercial e dez perguntas',()=>{
 for(const term of ['CRM','Agente de Inteligência Artificial','Automação de Atendimento','Automação de Processos','Integração entre Sistemas','Da necessidade à solução validada','Implantação \\+ licenças de uso'])assert.match(landing,new RegExp(term));
 const faqBlock=landing.slice(landing.indexOf('const faqs = ['),landing.indexOf('export function ToolLandingPage'));
 assert.equal((faqBlock.match(/^  \["/gm)||[]).length,10);
});

test('landing reutiliza marcas e componentes institucionais',()=>{
 for(const term of ['PublicHeader','PublicFooter','InstitutionalFaq','technology-meta.png','technology-whatsapp.jpg','technology-google.png','technology-openai.png','technology-nimble.png'])assert.match(landing,new RegExp(term));
});

test('questionário homologado permanece sem alterações de conteúdo nesta entrega',()=>{
 assert.match(diagnostic,/Encontre as ferramentas certas para sua operação/);
 assert.match(diagnostic,/fetch\('\/api\/tool-implementation'/);
});
