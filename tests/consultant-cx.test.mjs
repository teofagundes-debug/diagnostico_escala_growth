import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const validation=await readFile(new URL('../components/StrategicPlanValidation.tsx',import.meta.url),'utf8');
const diagnostics=await readFile(new URL('../app/api/diagnostics/route.ts',import.meta.url),'utf8');
const css=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');

test('o plano apresenta a consolidação da reunião em leitura antes do parecer final',()=>{
 const expected=['Resumo Executivo','Situação Atual da Empresa','Hipóteses Validadas','Objetivo Estratégico','Prioridades','Recursos já Implantados','Oportunidades Confirmadas','Informações Confirmadas pelo Cliente','Cronograma','Parecer Final do Consultor','Concluir Plano Estratégico'];
 let previous=-1;
 for(const label of expected){const position=validation.indexOf(label);assert.ok(position>previous,`${label} deve aparecer na ordem da jornada`);previous=position}
 assert.match(validation,/className="strategic-readonly"/);
 assert.equal((validation.match(/<textarea/g)||[]).length,1,'somente o Parecer Final deve ser editável');
});

test('o detalhe do diagnóstico carrega a reunião vinculada sem nova estrutura de banco',()=>{
 assert.match(diagnostics,/reunioes_estrategicas\?diagnostico_id=eq\./);
 assert.match(diagnostics,/reunioes_estrategicas:meetings/);
});

test('o menu administrativo permanece visível no desktop e preserva o mobile',()=>{
 assert.match(css,/@media\(min-width:901px\)\{\.central\{height:100vh/);
 assert.match(css,/\.central>main\{height:100vh;overflow-y:auto\}/);
});
