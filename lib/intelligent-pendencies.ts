export type IntelligentPendencyDefinition={codigo:string;titulo:string;categoria:string;rota?:string;matches:string[]};

export const INTELLIGENT_PENDENCY_RULES:IntelligentPendencyDefinition[]=[
 {codigo:'MARKETING_PARAMETROS',titulo:'Planejamento Operacional das Campanhas',categoria:'Implantação',rota:'/central/parametros-marketing',matches:['Google Ads','Meta Ads','Landing Page','Campanhas WhatsApp','Estratégia Comercial Digital','Gestão Google Ads','Gestão Meta Ads']},
 {codigo:'CRM_PIPELINE',titulo:'Definir Pipeline Comercial',categoria:'Gestão Comercial',matches:['CRM Comercial','CRM Avançado']},
 {codigo:'IA_ESCOPO',titulo:'Definir Escopo do Agente',categoria:'Inteligência Artificial',matches:['Agente de IA','Ativação e Treinamento de Agente de IA']},
 {codigo:'IA_BASE',titulo:'Enviar Base de Conhecimento',categoria:'Inteligência Artificial',matches:['Agente de IA','Ativação e Treinamento de Agente de IA']},
 {codigo:'DASHBOARD_INDICADORES',titulo:'Definir Indicadores',categoria:'Business Intelligence',matches:['Dashboard Executivo','Business Intelligence']},
 {codigo:'WHATSAPP_NUMERO',titulo:'Validar Número do WhatsApp',categoria:'Comunicação',matches:['WhatsApp Oficial']},
 {codigo:'WHATSAPP_META',titulo:'Conectar WhatsApp à Meta',categoria:'Comunicação',matches:['WhatsApp Oficial']},
 {codigo:'WHATSAPP_TEMPLATES',titulo:'Criar Templates de Campanha',categoria:'Marketing',matches:['Campanhas WhatsApp']}
];

const normalize=(value:unknown)=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
export function pendingDefinitions(resources:any[]){
 const names=resources.map(item=>String(item.nome||item.nome_snapshot||''));
 return INTELLIGENT_PENDENCY_RULES.map(rule=>({...rule,solutions:names.filter(name=>rule.matches.some(match=>normalize(name).includes(normalize(match))||normalize(match).includes(normalize(name))))})).filter(rule=>rule.solutions.length);
}
