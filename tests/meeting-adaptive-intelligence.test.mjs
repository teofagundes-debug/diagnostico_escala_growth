import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const component=read('components/MeetingPreparation.tsx');
const api=read('app/api/meeting-preparation/route.ts');

test('Prospect mantém recursos indisponíveis',()=>{
 assert.match(component,/platformEnabled=record\.tipo_relacionamento==='Cliente da Base'/);
 assert.match(component,/disabled=\{!platformEnabled\}/);
 assert.match(component,/Recursos disponíveis apenas para clientes da base\./);
});

test('Cliente da Base habilita a situação atual da plataforma',()=>{
 assert.match(component,/platformEnabled\?'': ' disabled'|platformEnabled\?'':' disabled'/);
 assert.match(component,/platformSituation=platformEnabled/);
 assert.match(component,/setRecord\(\{\.\.\.record,situacao_plataforma/);
});

test('Plataforma Nimble utiliza a referência canônica PLA-001',()=>{
 assert.match(component,/Plataforma Nimble/);
 assert.match(component,/'Plataforma Nimble':'PLA-001'/);
 assert.match(component,/canonicalRecommendationResource/);
});

test('CRM implantado troca implantação por padronização',()=>{
 assert.match(component,/if\(normalized\.includes\('crm'\)\).*Padronizar utilização do CRM/);
});

test('Dashboard implantado recomenda rotina de acompanhamento',()=>{
 assert.match(component,/if\(normalized\.includes\('dashboard'\)\).*Criar rotina de acompanhamento do Dashboard/);
});

test('WhatsApp Oficial implantado recomenda melhoria operacional',()=>{
 assert.match(component,/if\(normalized\.includes\('whatsapp'\)\).*Padronizar atendimento via WhatsApp Oficial/);
});

test('Diagnóstico Validado preserva a origem e é persistido na reunião',()=>{
 assert.match(component,/diagnostico_inicial:\{parecer:/);
 assert.match(component,/recomendacao_original:item\.original/);
 assert.match(component,/recomendacao_validada:item\.label/);
 assert.match(component,/diagnostico_validado:validatedDiagnostic/);
 assert.match(api,/diagnostico_validado/);
 assert.match(api,/dados_reuniao:meetingData/);
});

test('Bloco 1 exibe interpretação adaptativa mantendo chave original',()=>{
 assert.match(component,/adaptiveRecommendations\.map/);
 assert.match(component,/const name=recommendation\.original/);
 assert.match(component,/Diagnóstico inicial: \{name\}/);
 assert.match(component,/Visão validada: recurso/);
});

test('relatório registra divergência entre diagnóstico e validação',()=>{
 assert.match(component,/Evolução do Entendimento/);
 assert.match(component,/O diagnóstico inicial indicava/);
 assert.match(component,/Durante a reunião, foi confirmado/);
});
