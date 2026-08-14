import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const migration=read('database/migration_v60_revisao_estrategica.sql');
const revisions=read('app/api/strategic-revisions/route.ts');
const meeting=read('app/api/meeting-preparation/route.ts');
const ui=read('components/MeetingPreparation.tsx');

test('revisão possui identidade e vínculo explícito com a rodada anterior',()=>{
 assert.match(migration,/revisao_origem_id uuid references public\.reunioes_estrategicas\(id\)/);
 assert.match(migration,/revisao_numero integer/);
 assert.match(migration,/revisao_estrategica_id uuid references public\.reunioes_estrategicas\(id\)/);
 assert.match(revisions,/revisao_origem_id:source\.id/);
 assert.match(revisions,/revisao_numero:number/);
});

test('reunião concluída é somente lida e a revisão copia os dados como rascunho',()=>{
 assert.match(revisions,/source\.status!=='Realizada'/);
 assert.match(revisions,/clearConclusion\(source\.dados_reuniao\)/);
 assert.match(revisions,/status:'Agendada'/);
 assert.doesNotMatch(revisions,/reunioes_estrategicas\?id=eq[^\n]+method:'PATCH'/);
 assert.match(revisions,/delete conclusion\.resumo_executivo/);
});

test('conclusão da revisão cria nova versão DRAFT sem publicar',()=>{
 assert.match(meeting,/prepareExecutableDraftFromRevision/);
 assert.match(meeting,/version_number:version,status:'DRAFT'/);
 assert.match(meeting,/revisao_estrategica_id:input\.meeting\.id/);
 assert.doesNotMatch(meeting,/prepareExecutableDraftFromRevision[\s\S]{0,1600}status:'PUBLISHED'/);
 assert.match(meeting,/contextual_prescriptions:input\.contextualPrescriptions/);
 assert.match(meeting,/currentStrategicArtifacts/);
 assert.match(meeting,/reconcileRevisionActions/);
});

test('implantação e financeiro existentes não são atualizados pela revisão',()=>{
 assert.match(meeting,/if\(!isRevision\)await runStep\('resumo_financeiro'/);
 assert.match(meeting,/if\(currentImplementation&&!isRevision\)await runStep\('plano_implantacao'/);
 assert.match(meeting,/if\(!isRevision\)await runStep\('composicao_projeto'/);
 assert.doesNotMatch(revisions,/financeiro_growth|contratos_growth|aceites_growth|pagamentos_growth|proposta_publicacoes/);
});

test('rascunho comercial dependente é marcado para revisão sem apagar dados',()=>{
 assert.match(meeting,/status=eq\.Rascunho/);
 assert.match(meeting,/commercial_3_0_status:project\.commercial_3_0_snapshot\?'DESATUALIZADO':null/);
 assert.match(meeting,/revisao_estrategica_necessaria:true/);
 assert.doesNotMatch(meeting,/projetos_evolucao[^\n]+method:'DELETE'/);
});

test('interface oferece Nova Revisão Estratégica após uma rodada concluída',()=>{
 assert.match(ui,/Nova Revisão Estratégica/);
 assert.match(ui,/fetch\('\/api\/strategic-revisions'/);
 assert.match(ui,/setRecord\(\{\.\.\.revisionData,\.\.\.revision/);
});
