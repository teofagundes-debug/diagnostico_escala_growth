import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const component=readFileSync(new URL('../components/MeetingPreparation.tsx',import.meta.url),'utf8');

test('relatório preserva o diagnóstico e acrescenta a reunião em seções consultivas',()=>{
 assert.match(component,/diagnosticContext=Array\.from\(new Set\(\[data\.parecer,report\.parecer,report\.situacao_atual,data\.proximos_passos,report\.proximos_passos\]/);
 for(const section of ['Resumo Executivo','Realidade Atual da Empresa','Hipóteses Validadas','Prioridade Estratégica','Recursos Já Implantados','Oportunidades Confirmadas','Informações Confirmadas pelo Cliente','Próximos Passos'])assert.match(component,new RegExp(section));
});

test('hipótese e prioridade recebem linguagem consultiva sem alterar o registro',()=>{
 assert.match(component,/A hipótese levantada durante o diagnóstico foi confirmada ou complementada/);
 assert.match(component,/Registro da validação: “\$\{hypothesis\}”/);
 assert.match(component,/Como prioridade estratégica definida em conjunto com o cliente/);
});

test('recursos implantados e oportunidades adicionais são descritos',()=>{
 assert.match(component,/status==='Implantado'\|\|status==='Parcialmente Implantado'/);
 assert.match(component,/O cliente confirmou que já utiliza os seguintes recursos da plataforma/);
 assert.match(component,/additionalOpportunities/);
 assert.match(component,/legacyConfirmedOpportunities/);
});

test('respostas são apresentadas em texto corrido preservando o conteúdo original',()=>{
 assert.match(component,/O cliente informou que \$\{answer\}/);
 assert.match(component,/validations\.respostas_perguntas/);
 assert.doesNotMatch(component,/JSON\.stringify\(validations\.respostas_perguntas/);
});
