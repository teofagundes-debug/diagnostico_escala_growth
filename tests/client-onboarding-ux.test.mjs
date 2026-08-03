import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const onboarding=read('components/PortalOnboarding.tsx');
const portal=read('components/PortalApp.tsx');
const api=read('app/api/portal/route.ts');

test('Home alterna automaticamente entre Onboarding e Cliente Ativo',()=>{
 assert.match(onboarding,/if\(d\.methodStarted\)return <ActiveHome/);
 assert.match(onboarding,/Aguardando Formalização/);
 assert.match(onboarding,/Formalização concluída/);
 assert.match(onboarding,/Preparando início do Método/);
 assert.match(onboarding,/Método Escala Growth iniciado/);
});

test('primeira dobra conduz o cliente para a formalização',()=>{
 assert.match(onboarding,/Bem-vindo ao Método Escala Growth/);
 assert.match(onboarding,/Próxima ação/);
 assert.match(onboarding,/CONTINUAR FORMALIZAÇÃO/);
 assert.match(onboarding,/Revise o Projeto de Evolução, leia o Termo de Adesão/);
 assert.match(onboarding,/d\.nextMeeting&&/);
});

test('formalização possui as quatro etapas e o cenário sem pagamento',()=>{
 for(const text of ['Plano Estratégico','Projeto de Evolução','Contrato ou Termo','Aceite','Nenhuma ação necessária. Sua cobrança recorrente atual permanece inalterada.'])assert.match(onboarding,new RegExp(text));
 assert.ok(existsSync(new URL('../app/portal/formalizacao/page.tsx',import.meta.url)));
 assert.match(portal,/view==='formalizacao'\?<FormalizationUX/);
});

test('aceite exige a leitura de todos os documentos',()=>{
 for(const text of ['Li o Plano Estratégico.','Li o Projeto de Evolução.','Li o Contrato ou Termo.','Concordo com as condições apresentadas.','ACEITAR E INICIAR MINHA JORNADA'])assert.match(portal,new RegExp(text));
});

test('Painel Executivo e Evolução ficam bloqueados durante o Onboarding',()=>{
 assert.match(portal,/if\(!d\.methodStarted\)return <section className="portal-card radar-empty"/);
 assert.match(portal,/Seu Painel Executivo será liberado automaticamente após a conclusão da formalização/);
 assert.match(portal,/Esta área será liberada após a conclusão da formalização e o início do Método Escala Growth/);
});

test('status vivo do projeto promove automaticamente a Home para Cliente Ativo',()=>{
 assert.match(api,/status:rawProject\?\.status\|\|publishedSnapshot\.project\.status/);
 assert.match(api,/methodStarted=Boolean\(project\?\.status==='Formalizado'/);
});
