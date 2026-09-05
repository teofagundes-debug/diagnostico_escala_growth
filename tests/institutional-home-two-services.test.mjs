import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const home=read('components/landing/LandingPage.tsx');
const header=read('components/landing/PublicHeader.tsx');
const metadata=read('app/page.tsx');

test('Hero apresenta as duas linhas comerciais com o mesmo peso',()=>{
 assert.match(home,/Estratégia e tecnologia para sua empresa/);
 assert.match(home,/Já sabe o que precisa implantar\?/);
 assert.match(home,/Quer melhorar suas vendas\?/);
 assert.match(home,/href="\/implantacao-ferramentas"/);
 assert.match(home,/href="\/escala-growth"/);
});

test('Rodada 2 remove a repetição dos dois caminhos e mantém a navegação válida',()=>{
 assert.doesNotMatch(home,/id="solucoes"/);
 assert.doesNotMatch(home,/choiceSummary/);
 assert.doesNotMatch(header,/#solucoes/);
 assert.match(header,/current \? `\/#\$\{id\}` : `#\$\{id\}`/);
});

test('Diagnóstico permanece contextualizado dentro da Consultoria',()=>{
 const consulting=home.slice(home.indexOf('id="consultoria"'),home.indexOf('id="como-atuamos"'));
 assert.match(consulting,/Método Escala Growth/);
 assert.match(consulting,/href="\/diagnostico"/);
 assert.doesNotMatch(header,/Fazer diagnóstico/);
});

test('Home reutiliza os assets institucionais existentes',()=>{
 for(const asset of ['technology-meta.png','technology-whatsapp.jpg','technology-google.png','technology-openai.png','technology-nimble.png','teofilo-oliveira-fagundes.jpg'])assert.match(home,new RegExp(asset));
});

test('metadata representa estratégia, tecnologia e as duas linhas',()=>{
 assert.match(metadata,/CRM, Inteligência Artificial, automações e integrações/);
 assert.doesNotMatch(metadata,/por meio do Método Escala Growth/);
});
