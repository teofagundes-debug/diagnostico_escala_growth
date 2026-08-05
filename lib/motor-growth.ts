export type GrowthClassification='Obrigatório'|'Recomendado'|'Opcional';

const normalize=(value:unknown)=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const BASE=['Plataforma Nimble','WhatsApp Oficial','CRM Comercial','Dashboard Executivo','Treinamento Comercial','Implantação Operacional'];
const STRATEGY:Record<string,string[]>={
 atrair:['Gestão Google Ads','Gestão Meta Ads','Landing Page','Campanhas WhatsApp','Estratégia Comercial Digital','SEO','Conteúdo','LinkedIn'],
 organizar:['CRM Avançado','Integrações','Automações','Dashboard Executivo','Padronização'],
 converter:['Agente de IA','Treinamento Comercial','Cadência Comercial','Qualificação','Automações'],
 crescer:['Dashboard Executivo','Business Intelligence','Indicadores','Reuniões de Evolução','Escalabilidade']
};
export const GROWTH_WEIGHTS:Record<string,Record<string,number>>={
 'Gestão Google Ads':{atrair:10,organizar:1,converter:2,crescer:8},
 'Gestão Meta Ads':{atrair:10,organizar:1,converter:3,crescer:8},
 'CRM Comercial':{atrair:3,organizar:10,converter:9,crescer:8},
 'Dashboard Executivo':{atrair:2,organizar:8,converter:7,crescer:10},
 'Agente de IA':{atrair:4,organizar:7,converter:10,crescer:8}
};
const aliases:Record<string,string[]>={
 'Plataforma Nimble':['Licença Plataforma Nimble'],
 'Landing Page':['Landing Page Institucional'],
 'Treinamento Comercial':['Treinamento da Equipe'],
 'Implantação Operacional':['Implantação Técnica'],
 'Business Intelligence':['BI'],
 'Automações':['Integrações e Automações'],
 'Agente de IA':['Ativação e Treinamento de Agente de IA','Gestão de Agente de IA']
};
const find=(catalog:any[],name:string)=>catalog.find(item=>[name,...(aliases[name]||[])].some(alias=>normalize(item.nome)===normalize(alias)))||null;
const has=(names:string[],name:string)=>[name,...(aliases[name]||[])].some(alias=>names.some(current=>normalize(current)===normalize(alias)));

export function composeGrowthProject({catalog,activeResources=[],priority='Organizar',baseClient=false,signals={}}:{catalog:any[];activeResources?:string[];priority?:string;baseClient?:boolean;signals?:Record<string,unknown>}){
 const objective=Object.keys(STRATEGY).find(key=>normalize(priority).includes(key))||'organizar';
 const mandatory=baseClient?[]:BASE.map(name=>find(catalog,name)).filter(Boolean).filter(item=>!has(activeResources,item.nome)).map(item=>({...item,classificacao:'Obrigatório' as GrowthClassification,origem:'Estrutura Base do Método',peso:10,fase:'Estrutura Obrigatória'}));
 let strategic=STRATEGY[objective].map(name=>find(catalog,name)).filter(Boolean).filter(item=>!has(activeResources,item.nome)).map((item,index)=>({...item,classificacao:(index<5?'Recomendado':'Opcional') as GrowthClassification,origem:`Diagnóstico — ${objective}`,peso:GROWTH_WEIGHTS[item.nome]?.[objective]??Math.max(1,10-index),fase:index<5?'Recomendações Estratégicas':'Evoluções Futuras'}));
 const needsAcquisition=objective==='atrair'&&(!signals.possui_marketing||!signals.possui_agencia||!signals.realiza_campanhas);
 if(needsAcquisition)strategic=strategic.map(item=>['Gestão Google Ads','Gestão Meta Ads','Landing Page Institucional','Campanhas WhatsApp','Estratégia Comercial Digital'].some(name=>normalize(name)===normalize(item.nome))?{...item,classificacao:'Recomendado' as GrowthClassification,peso:10,origem:'Gatilho automático de aquisição'}:item);
 strategic.sort((a,b)=>b.peso-a.peso);
 return{objective,baseClient,mandatory,strategic:strategic.filter(item=>item.classificacao==='Recomendado'),future:strategic.filter(item=>item.classificacao==='Opcional'),all:[...mandatory,...strategic],schedule:[{fase:'Estrutura Obrigatória',items:mandatory},{fase:'Recomendações Estratégicas',items:strategic.filter(item=>item.classificacao==='Recomendado')},{fase:'Evoluções Futuras',items:strategic.filter(item=>item.classificacao==='Opcional')}]};
}
