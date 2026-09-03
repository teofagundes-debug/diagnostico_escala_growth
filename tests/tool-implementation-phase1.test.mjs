import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {effectiveSolutions,initialToolProposal,toolCommercialSynthesis,toolImplementationItems,toolPresentationSynthesis,toolSolutionCards} from "../lib/toolImplementation.ts";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("mantém Implantação de Ferramentas independente do diagnóstico Growth",()=>{
  const diagnostic=read("components/ToolImplementationDiagnostic.tsx");
  assert.doesNotMatch(diagnostic,/calculateIEG|MotorEstratégico|strategicSolutionResolver|\/api\/diagnostics/);
  assert.match(diagnostic,/\/api\/tool-implementation/);
  assert.match(read("app/servicos/page.tsx"),/Implantar Ferramentas/);
  assert.match(read("app/servicos/page.tsx"),/Fazer Diagnóstico Escala Growth/);
});

test("mapeia Ainda não sei e exibe somente o caminho correspondente",()=>{
  assert.deepEqual(effectiveSolutions(["UNSURE"],"SALES"),["CRM"]);
  assert.deepEqual(effectiveSolutions(["UNSURE"],"INTEGRATION"),["SYSTEM_INTEGRATION"]);
  assert.deepEqual(effectiveSolutions(["CRM","UNSURE"],"SALES"),["CRM"]);
});

test("reutiliza canais para IA e atendimento sem duplicar a resposta",()=>{
  const result=initialToolProposal({area:"COMERCIAL_E_ATENDIMENTO",solutions:["AI_AGENT","SERVICE_AUTOMATION"],answers:{channels:["WhatsApp","Instagram"],ai_functions:["Qualificar contatos"],service_functions:["Recepção e primeiro atendimento"]}});
  assert.deepEqual(result.configuration.ai_agent.channels,["WhatsApp","Instagram"]);
  assert.deepEqual(result.configuration.service_automation.channels,["WhatsApp","Instagram"]);
  const diagnostic=read("components/ToolImplementationDiagnostic.tsx");
  assert.match(diagnostic,/needsChannels=has\('AI_AGENT'\)\|\|has\('SERVICE_AUTOMATION'\)/);
  assert.equal((diagnostic.match(/title="Em quais canais a solução deverá atuar\?"/g)||[]).length,1);
});

test("automação de processos e integração permanecem sem preço inventado",()=>{
  const result=initialToolProposal({area:"COMERCIAL",solutions:["PROCESS_AUTOMATION","SYSTEM_INTEGRATION"],answers:{process_summary:"Atualizar cadastros",integration_systems:"CRM e ERP"}});
  assert.equal(result.validation.length,2);
  assert.ok(result.validation.every(item=>item.includes("escopo a validar")));
  assert.equal("financeiro" in result,false);
});

test("cards comerciais exibem apenas configurações realmente coletadas",()=>{
  const proposal=initialToolProposal({area:"COMERCIAL_E_ATENDIMENTO",solutions:["CRM","AI_AGENT","PROCESS_AUTOMATION","SYSTEM_INTEGRATION"],answers:{crm_current:"NAO",crm_users:"1 a 3",crm_use:"Gestão de vendas e oportunidades",ai_area:"Comercial / Vendas",channels:["WhatsApp"],ai_functions:["Responder dúvidas","Qualificar contatos"],process_summary:"disparar notificações",process_uses_system:"Não",integration_systems:"ERP",integration_flow:"Consultar pendências financeiras"}});
  const cards=toolSolutionCards(proposal.configuration,proposal.validation);
  assert.equal(cards.length,4);
  assert.deepEqual(cards.find(card=>card.id==="CRM").details.map(item=>item.label),["Uso","Usuários","Situação atual"]);
  assert.deepEqual(cards.find(card=>card.id==="AI_AGENT").details.find(item=>item.label==="Canais").value,["WhatsApp"]);
  assert.equal(cards.find(card=>card.id==="PROCESS_AUTOMATION").scopeStatus,"Escopo a validar na reunião");
  assert.equal(cards.find(card=>card.id==="SYSTEM_INTEGRATION").scopeStatus,"Escopo a validar na reunião");
});

test("síntese comercial usa fatos coletados e preserva edição do consultor",()=>{
  const configuration={solutions:[{id:"CRM",name:"CRM"},{id:"SYSTEM_INTEGRATION",name:"Integração entre Sistemas"}],crm:{use:"Gestão de vendas e oportunidades"},system_integration:{systems:"ERP",expected_flow:"Consultar pendências"}};
  const generated=toolCommercialSynthesis(configuration);
  assert.match(generated,/CRM/);
  assert.match(generated,/ERP/);
  assert.doesNotMatch(generated,/Agente de IA|WhatsApp/);
  assert.equal(toolPresentationSynthesis("Texto final do consultor.",configuration),"Texto final do consultor.");
  assert.equal(toolPresentationSynthesis("A empresa busca CRM para a área comercial.",configuration),generated);
});

test("entregáveis acompanham somente as soluções presentes",()=>{
  const items=toolImplementationItems({solutions:[{id:"CRM"}]},["Estruturação inicial do CRM","Configuração do Agente de IA","Entrega personalizada"]);
  assert.ok(items.includes("Estruturação inicial do CRM"));
  assert.ok(items.includes("Entrega personalizada"));
  assert.ok(!items.some(item=>item.includes("Agente")));
  assert.ok(!items.some(item=>item.includes("Integrações")));
});

test("migration é aditiva, isolada, atômica na entrada e protegida por RLS",()=>{
  const migration=read("database/migration_v68_implantacao_ferramentas_fase1.sql");
  assert.match(migration,/create table if not exists public\.projetos_implantacao_ferramentas/);
  assert.match(migration,/create table if not exists public\.pre_propostas_implantacao/);
  assert.match(migration,/create table if not exists public\.pre_propostas_implantacao_historico/);
  assert.match(migration,/tipo_servico='IMPLANTACAO_FERRAMENTAS'/);
  assert.match(migration,/enable row level security/g);
  assert.match(migration,/to service_role using\(true\) with check\(true\)/);
  assert.match(migration,/revoke all on function public\.registrar_diagnostico_implantacao\(jsonb\) from public,anon,authenticated/);
  assert.match(migration,/returns uuid language plpgsql/);
  assert.doesNotMatch(migration,/drop table|drop column|alter table public\.diagnosticos|alter table public\.strategic_/i);
});

test("API separa entrada pública da gestão exclusiva do Master",()=>{
  const api=read("app/api/tool-implementation/route.ts");
  assert.match(api,/export async function POST/);
  assert.match(api,/normalizeBrazilianWhatsApp/);
  assert.match(api,/registrar_diagnostico_implantacao/);
  assert.match(api,/export async function GET[\s\S]*isMaster/);
  assert.match(api,/export async function PATCH[\s\S]*isMaster/);
  assert.match(api,/status==='VALIDADA'[\s\S]*snapshot_final/);
});

test("pré-proposta continua interna e apresentação omite campos administrativos",()=>{
  const admin=read("components/ToolImplementationAdmin.tsx");
  const presentation=admin.slice(admin.indexOf("function Presentation"));
  assert.match(admin,/Apresentar ao Cliente/);
  assert.match(presentation,/Configuração da solução/);
  assert.match(presentation,/Investimento inicial/);
  assert.match(presentation,/Licenças de uso/);
  assert.doesNotMatch(presentation,/observacoes_internas|custos internos|margem|Portal do Cliente/);
  assert.match(admin,/Nenhum conteúdo foi publicado ao cliente/);
});

test("apresentação abre em nova aba e mantém a Central disponível",()=>{
  const admin=read("components/ToolImplementationAdmin.tsx");
  const presentation=read("components/ToolImplementationPresentation.tsx");
  assert.match(admin,/target="_blank"/);
  assert.match(admin,/rel="noopener noreferrer"/);
  assert.match(admin,/projeto_id=\$\{encodeURIComponent\(selected\.id\)\}/);
  assert.match(admin,/pre_proposta_id=\$\{encodeURIComponent\(proposal\.id\)\}/);
  assert.match(presentation,/\/api\/tool-implementation\?id=/);
  assert.match(presentation,/cache:'no-store'/);
  assert.doesNotMatch(presentation,/returnfetch/);
  assert.match(presentation,/projectId,proposalId/);
  assert.match(presentation,/Solução proposta/);
  assert.match(presentation,/O que vamos implantar/);
  assert.doesNotMatch(presentation,/Quantidade inicial/);
});

test("Central e sitemap expõem as novas rotas sem substituir URLs atuais",()=>{
  const central=read("components/CentralApp.tsx"),sitemap=read("app/sitemap.ts");
  assert.match(central,/Implantação de Ferramentas/);
  assert.match(central,/\/central\/implantacao-ferramentas/);
  for(const route of ["/diagnostico","/escala-growth","/servicos","/implantacao-ferramentas"])assert.match(sitemap,new RegExp(route.replace("/","\\/")));
});
