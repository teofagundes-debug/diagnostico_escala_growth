import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composeGrowthProject} from '../lib/motor-growth.ts';
const read=path=>readFileSync(path,'utf8');

test('Motor copia objetivo, investimento e regras exclusivamente da Biblioteca',()=>{const catalog=[{id:'1',nome:'Gestão Google Ads',tipo:'Mensalidade',objetivo_padrao:'Gerar oportunidades qualificadas',investimento_minimo_recomendado:1800,investimento_ideal_minimo:2500,investimento_ideal_maximo:4000,gera_pendencias:true,abre_planejamento_operacional:true,permite_executor_terceiro:false,permite_equipe_interna:true}],result=composeGrowthProject({catalog,priority:'Atrair',signals:{possui_marketing:false,possui_agencia:false,realiza_campanhas:false}}),solution=result.strategic.find(item=>item.nome==='Gestão Google Ads');assert.equal(solution.objetivo_padrao,'Gerar oportunidades qualificadas');assert.equal(solution.investimento_recomendado,1800);assert.equal(solution.parametros_metodo.investimento_ideal_maximo,4000);assert.equal(solution.parametros_metodo.permite_executor_terceiro,false)});

test('projeto preserva snapshot dos parâmetros utilizados na geração',()=>{const api=read('app/api/commercial-evolution/route.ts'),sql=read('database/migration_v48_parametros_biblioteca_solucoes.sql'),panel=read('components/ExecutionStrategyPanel.tsx');assert.match(api,/parametros_snapshot:parametersSnapshot/);assert.match(sql,/parametros_snapshot jsonb/);assert.match(panel,/item\.parametros_snapshot\?\.investimento_minimo_recomendado/);assert.doesNotMatch(panel,/verba_recomendada/)});

test('cadastro da Biblioteca expõe todos os parâmetros estratégicos',()=>{const ui=read('components/CommercialAdmin.tsx'),api=read('app/api/commercial/route.ts');for(const field of ['tipo_implantacao','treinamento_obrigatorio','gera_pendencias','abre_planejamento_operacional','permite_executor_terceiro','permite_equipe_interna','investimento_minimo_recomendado','investimento_ideal_minimo','investimento_ideal_maximo','observacoes_estrategicas'])assert.ok(ui.includes(field)&&api.includes(field),field)});
