/* eslint-disable @typescript-eslint/no-explicit-any */
export const TOOL_SOLUTIONS=[
 {id:'CRM',name:'CRM',description:'Organizar contatos, oportunidades e processo comercial.'},
 {id:'AI_AGENT',name:'Agente de Inteligência Artificial',description:'Automatizar atendimentos e interações usando IA.'},
 {id:'SERVICE_AUTOMATION',name:'Automação de Atendimento',description:'Organizar e automatizar o atendimento em diferentes canais.'},
 {id:'PROCESS_AUTOMATION',name:'Automação de Processos',description:'Automatizar tarefas e rotinas realizadas manualmente.'},
 {id:'SYSTEM_INTEGRATION',name:'Integração entre Sistemas',description:'Conectar sistemas para troca de informações e execução de processos.'},
 {id:'UNSURE',name:'Ainda não sei exatamente',description:'Quero entender qual solução faz mais sentido para minha necessidade.'},
] as const;

export const UNKNOWN_PATHS:Record<string,string|null>={SALES:'CRM',SERVICE:'SERVICE_AUTOMATION',AI:'AI_AGENT',PROCESS:'PROCESS_AUTOMATION',INTEGRATION:'SYSTEM_INTEGRATION',OTHER:null};
export const solutionName=(id:string)=>TOOL_SOLUTIONS.find(item=>item.id===id)?.name||id;
export function effectiveSolutions(selected:string[],unknownPath?:string){const mapped=selected.includes('UNSURE')?UNKNOWN_PATHS[String(unknownPath||'')]:null;return [...new Set([...selected.filter(id=>id!=='UNSURE'),...(mapped?[mapped]:[])])];}
export function initialToolProposal(input:any){
 const solutions=effectiveSolutions(input.solutions||[],input.answers?.unknown_path),answers=input.answers||{},validation:string[]=[];
 const configuration:any={area_interesse:input.area,solutions:solutions.map(id=>({id,name:solutionName(id)}))};
 if(solutions.includes('CRM'))configuration.crm={users:answers.crm_users||null,use:answers.crm_use||null,current:answers.crm_current||null,current_name:answers.crm_name||null};
 if(solutions.includes('AI_AGENT'))configuration.ai_agent={area:answers.ai_area||input.area,channels:answers.channels||[],functions:answers.ai_functions||[]};
 if(solutions.includes('SERVICE_AUTOMATION'))configuration.service_automation={channels:answers.channels||[],people:answers.service_people||null,functions:answers.service_functions||[]};
 if(solutions.includes('PROCESS_AUTOMATION')){configuration.process_automation={summary:answers.process_summary||'',uses_system:answers.process_uses_system||null,system:answers.process_system||null};validation.push('Automação de Processos: escopo a validar na reunião.');}
 if(solutions.includes('SYSTEM_INTEGRATION')){configuration.system_integration={systems:answers.integration_systems||'',expected_flow:answers.integration_flow||''};validation.push('Integração entre Sistemas: escopo a validar na reunião.');}
 if(answers.unknown_path==='OTHER')validation.push(`Outra necessidade: ${answers.other_need||'escopo a validar na reunião.'}`);
 const names=solutions.map(solutionName),synthesis=`A empresa busca ${names.length?names.join(', '):'identificar a solução mais adequada'} para a área de ${String(input.area||'').replaceAll('_',' ').toLowerCase()}. A configuração inicial será validada na primeira reunião.`;
 const implementationItems=['Configuração da plataforma',...(solutions.includes('CRM')?['Estruturação inicial do CRM']:[]),...((solutions.includes('AI_AGENT')||solutions.includes('SERVICE_AUTOMATION'))?['Configuração dos canais']:[]),...(solutions.includes('AI_AGENT')?['Configuração do Agente de IA']:[]),...((solutions.includes('PROCESS_AUTOMATION')||solutions.includes('SYSTEM_INTEGRATION'))?['Automações e integrações previstas no escopo']:[]),'Testes e homologação','Treinamento','Entrada em operação'];
 return{solutions,configuration,validation,synthesis,implementationItems:[...new Set(implementationItems)]};
}
