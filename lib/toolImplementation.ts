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
 const synthesis=toolCommercialSynthesis(configuration);
 const implementationItems=['Configuração da plataforma',...(solutions.includes('CRM')?['Estruturação inicial do CRM']:[]),...((solutions.includes('AI_AGENT')||solutions.includes('SERVICE_AUTOMATION'))?['Configuração dos canais']:[]),...(solutions.includes('AI_AGENT')?['Configuração do Agente de IA']:[]),...((solutions.includes('PROCESS_AUTOMATION')||solutions.includes('SYSTEM_INTEGRATION'))?['Automações e integrações previstas no escopo']:[]),'Testes e homologação','Treinamento','Entrada em operação'];
 return{solutions,configuration,validation,synthesis,implementationItems:[...new Set(implementationItems)]};
}

const descriptions:Record<string,string>={CRM:'Organização de contatos, oportunidades e processo comercial.',AI_AGENT:'Automação inteligente para atendimento e interações com clientes.',SERVICE_AUTOMATION:'Organização e automação do atendimento nos canais utilizados pela empresa.',PROCESS_AUTOMATION:'Automação de tarefas e rotinas operacionais.',SYSTEM_INTEGRATION:'Conexão entre sistemas para troca de informações e execução de processos.'};
const currentCrm:Record<string,string>={NAO:'Não utiliza CRM',SUBSTITUIR:'Utiliza CRM e deseja substituir',MELHORAR:'Utiliza CRM e deseja ampliar ou melhorar'};
const clean=(value:any)=>Array.isArray(value)?value.filter(Boolean):value===null||value===undefined||value===''?null:value;
const detail=(label:string,value:any)=>{const normalized=clean(value);return normalized===null||Array.isArray(normalized)&&!normalized.length?null:{label,value:normalized}};
export type ToolSolutionCard={id:string|null;name:string;description:string;details:{label:string;value:string|string[]}[];scopeStatus:string|null;scopeResolution?:{definition:string;resource_name:string}|null};

export function toolSolutionCards(configuration:any,validation:any[]=[]):ToolSolutionCard[]{const config=configuration||{},validationText=(validation||[]).join(' ');return (config.solutions||[]).map((solution:any)=>{const id=String(solution.id||''),details:any[]=[];let scopeStatus:string|null=null;if(id==='CRM'){const value=config.crm||{};details.push(detail('Uso',value.use),detail('Usuários',value.users),detail('Situação atual',currentCrm[value.current]||value.current),detail('CRM atual',value.current_name))}if(id==='AI_AGENT'){const value=config.ai_agent||{};details.push(detail('Atuação',value.area),detail('Canais',value.channels),detail('Funções',value.functions))}if(id==='SERVICE_AUTOMATION'){const value=config.service_automation||{};details.push(detail('Canais',value.channels),detail('Equipe',value.people?`${value.people} atendentes`:null),detail('Automatizações',value.functions))}if(id==='PROCESS_AUTOMATION'){const value=config.process_automation||{};details.push(detail('Processo',value.summary),detail('Utiliza sistema externo',value.uses_system),detail('Sistema',value.system));scopeStatus='Escopo a validar na reunião'}if(id==='SYSTEM_INTEGRATION'){const value=config.system_integration||{};details.push(detail('Sistemas',value.systems),detail('Objetivo',value.expected_flow));scopeStatus='Escopo a validar na reunião'}if(!scopeStatus&&validationText.toLowerCase().includes(solutionName(id).toLowerCase()))scopeStatus='Escopo a validar na reunião';return{id:solution.id||null,name:solution.name||solutionName(id),description:descriptions[id]||'Solução configurada para a necessidade apresentada.',details:details.filter(Boolean),scopeStatus}})}

export function toolPresentationSolutionCards(configuration:any,validation:any[]=[],resolutions:any[]=[],commercialItems:any[]=[],catalog:any[]=[]){
 const cards=toolSolutionCards(configuration,validation).map(card=>{const resolution=resolutions.find(item=>item.solution_type===card.id&&item.definition?.trim()&&item.resource_name?.trim());return resolution?{...card,scopeStatus:null,scopeResolution:{definition:resolution.definition,resource_name:resolution.resource_name}}:card}),solutionIds=new Set(cards.map(card=>card.id).filter(Boolean)),seenResources=new Set<string>();
 for(const item of commercialItems||[]){const resourceId=String(item.resource_id||item.id||''),origins=(item.origens||[]).map(String);if(resourceId&&seenResources.has(resourceId))continue;if(resourceId)seenResources.add(resourceId);if(origins.some((origin:string)=>solutionIds.has(origin)))continue;const canonical=(catalog||[]).find(resource=>resource.id===item.resource_id)||{},details:any[]=[];if(item.categoria)details.push({label:'Aplicação',value:String(item.categoria)});if(Number(item.quantidade)>1)details.push({label:'Quantidade',value:String(item.quantidade)});cards.push({id:resourceId||null,name:item.nome||canonical.nome||'Recurso da solução',description:canonical.descricao||'',details,scopeStatus:null})}
 return cards;
}

const naturalJoin=(items:string[])=>items.length<2?items[0]||'validar a solução mais adequada':`${items.slice(0,-1).join(', ')} e ${items.at(-1)}`;
const withoutLeadingVerb=(value:any,verbs:RegExp)=>String(value||'').trim().replace(verbs,'').trim();
export function toolCommercialSynthesis(configuration:any){const config=configuration||{},parts:string[]=[];if(config.crm)parts.push(`estruturar a operação com CRM${config.crm.use?` para ${String(config.crm.use).toLowerCase()}`:''}`);if(config.ai_agent)parts.push(`utilizar Inteligência Artificial em ${String(config.ai_agent.area||'atendimento e interações').toLowerCase()}${config.ai_agent.channels?.length?` nos canais ${naturalJoin(config.ai_agent.channels)}`:''}`);if(config.service_automation)parts.push(`organizar e automatizar o atendimento${config.service_automation.channels?.length?` em ${naturalJoin(config.service_automation.channels)}`:''}`);if(config.process_automation?.summary)parts.push(`automatizar ${withoutLeadingVerb(config.process_automation.summary,/^(automatizar|disparar)\s+/i).replace(/^notifica/i,'o disparo de notifica')}`);if(config.system_integration?.systems)parts.push(`integrar a operação com ${withoutLeadingVerb(config.system_integration.systems,/^(integrar(?:\s+(?:a operação|o sistema))?\s+(?:com|ao)?|conectar(?:\s+(?:com|ao))?)\s+/i)}`);return `Sua empresa busca ${naturalJoin(parts)}. A configuração abaixo foi preparada como ponto de partida e será validada nesta reunião.`}

export function toolPresentationSynthesis(synthesis:string|undefined,configuration:any){const current=String(synthesis||'').trim();return !current||current.startsWith('A empresa busca ')?toolCommercialSynthesis(configuration):current}

export function toolImplementationItems(configuration:any,stored:any[]=[]){const ids=new Set((configuration?.solutions||[]).map((item:any)=>item.id)),known=[['Configuração da plataforma',true],['Estruturação inicial do CRM',ids.has('CRM')],['Configuração dos canais',ids.has('AI_AGENT')||ids.has('SERVICE_AUTOMATION')],['Configuração do Agente de Inteligência Artificial',ids.has('AI_AGENT')],['Configuração das automações previstas no escopo',ids.has('SERVICE_AUTOMATION')||ids.has('PROCESS_AUTOMATION')],['Integrações previstas no escopo',ids.has('SYSTEM_INTEGRATION')],['Testes e homologação',true],['Treinamento',true],['Entrada em operação',true]] as [string,boolean][];const legacyPatterns=/estruturação inicial do crm|configuração dos canais|configuração do agente|automações e integrações previstas|configuração das automações|integrações previstas/i,custom=(stored||[]).filter((item:any)=>!legacyPatterns.test(String(item)));return [...new Set([...known.filter(([,included])=>included).map(([item])=>item),...custom])]}

export function toolPresentationImplementationItems(configuration:any,stored:any[]=[],resolutions:any[]=[],commercialItems:any[]=[],catalog:any[]=[]){
 const resolved=new Set(resolutions.filter(item=>item.definition?.trim()&&item.resource_name?.trim()).map(item=>item.solution_type));
 const ids=new Set((configuration?.solutions||[]).map((item:any)=>item.id));
 const known=[['Configuração da plataforma',true],['Estruturação inicial do CRM',ids.has('CRM')],['Configuração dos canais',ids.has('AI_AGENT')||ids.has('SERVICE_AUTOMATION')],['Configuração do Agente de Inteligência Artificial',ids.has('AI_AGENT')],['Configuração das automações de atendimento',ids.has('SERVICE_AUTOMATION')],['Automação de Processos prevista no escopo',ids.has('PROCESS_AUTOMATION')&&!resolved.has('PROCESS_AUTOMATION')],['Integrações previstas no escopo',ids.has('SYSTEM_INTEGRATION')&&!resolved.has('SYSTEM_INTEGRATION')],['Testes e homologação',true],['Treinamento',true],['Entrada em operação',true]] as [string,boolean][];
 const resolutionItems=resolutions.filter(item=>resolved.has(item.solution_type)).map(item=>`${item.resource_name}: ${item.definition}`);
 const legacyPatterns=/estruturação inicial do crm|configuração dos canais|configuração do agente|automações e integrações previstas|configuração das automações|automação de processos prevista|integrações previstas/i;
 const catalogDeliveryKeys=new Set((catalog||[]).flatMap((resource:any)=>Array.isArray(resource.entregas_padrao)?resource.entregas_padrao:[]).map(normalizedImplementationKey));
 const catalogResourceKeys=new Set((catalog||[]).flatMap((resource:any)=>[resource.nome,`Implantação de ${resource.nome}`]).filter(Boolean).map(normalizedImplementationKey));
 const custom=(stored||[]).filter((item:any)=>{const key=normalizedImplementationKey(item);return !legacyPatterns.test(String(item))&&!catalogDeliveryKeys.has(key)&&!catalogResourceKeys.has(key)});
 const configuredSolutionIds=new Set((configuration?.solutions||[]).map((solution:any)=>String(solution.id)));
 const currentResources=(commercialItems||[]).filter((item:any)=>!(item.origens||[]).some((origin:any)=>configuredSolutionIds.has(String(origin)))).map((item:any)=>`Implantação de ${item.nome||catalog.find((resource:any)=>resource.id===item.resource_id)?.nome||'recurso contratado'}`);
 const all=[...known.filter(([,included])=>included).map(([item])=>item),...resolutionItems,...currentResources,...custom];
 const seen=new Set<string>();
 return all.filter(item=>{const key=normalizedImplementationKey(item);if(seen.has(key))return false;seen.add(key);return true});
}

const normalizedImplementationKey=(value:any)=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
