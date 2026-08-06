export type GrowthClassification='Obrigatório'|'Recomendado'|'Opcional';

const normalize=(value:unknown)=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const BASE=['Plataforma Nimble','WhatsApp Oficial','CRM Comercial','Dashboard Executivo','Treinamento Comercial','Implantação Operacional'];
const STRATEGY:Record<string,string[]>={
 atrair:['Gestão Google Ads','Gestão Meta Ads','Landing Page','Campanhas WhatsApp','Estratégia Comercial Digital','SEO','Conteúdo','LinkedIn'],
 organizar:['CRM Avançado','Integrações','Automações','Dashboard Executivo','Padronização'],
 acompanhar:['CRM Comercial','Dashboard Executivo','Cadência Comercial','Automações','Reuniões de Evolução'],
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
const list=(value:unknown):any[]=>Array.isArray(value)?value:value===null||value===undefined||value===''?[]:[value];
const textList=(value:unknown):string[]=>list(value).flatMap(item=>{if(typeof item==='string'){const trimmed=item.trim();if(trimmed.startsWith('[')||trimmed.startsWith('{')){try{return textList(JSON.parse(trimmed))}catch{}}return item.split(/[\n,;]+/)}if(item?.nome)return[item.nome];if(item&&typeof item==='object')return Object.values(item).flatMap(textList);return[]}).map(item=>String(item).trim()).filter(Boolean);
const pillarKey=(value:unknown)=>['atrair','organizar','acompanhar','converter','crescer'].find(key=>normalize(value).includes(key));
const includesAny=(text:string,terms:string[])=>terms.some(term=>text.includes(normalize(term)));
type DecisionSignals={
 pillarScores?:Record<string,number>;
 questionScores?:Array<{pilar?:string;pergunta?:string;valor?:number}>;
 openAnswers?:Array<{pergunta?:string;resposta?:string}>|string[];
 meetingPriority?:string;
 approvedRecommendations?:unknown;
 removedRecommendations?:unknown;
 newRecommendations?:unknown;
 possui_marketing?:boolean|null;
 possui_agencia?:boolean|null;
 realiza_campanhas?:boolean|null;
 [key:string]:unknown;
};
type Candidate={name:string;weight:number;reasons:string[]};
const addCandidate=(map:Map<string,Candidate>,name:string,weight:number,reason:string)=>{const key=normalize(name),current=map.get(key);if(!current||weight>current.weight)map.set(key,{name,weight,reasons:[...(current?.reasons||[]),reason]});else if(!current.reasons.includes(reason))current.reasons.push(reason)};
const solutionParameters=(item:any)=>({objetivo_padrao:item.objetivo_padrao||null,tipo_implantacao:item.tipo_implantacao||null,tempo_medio_implantacao:item.tempo_medio_implantacao||null,treinamento_obrigatorio:item.treinamento_obrigatorio===true,gera_pendencias:item.gera_pendencias===true,abre_planejamento_operacional:item.abre_planejamento_operacional===true,permite_executor_terceiro:item.permite_executor_terceiro!==false,permite_equipe_interna:item.permite_equipe_interna!==false,investimento_minimo_recomendado:Number(item.investimento_minimo_recomendado||0),investimento_ideal_minimo:item.investimento_ideal_minimo==null?null:Number(item.investimento_ideal_minimo),investimento_ideal_maximo:item.investimento_ideal_maximo==null?null:Number(item.investimento_ideal_maximo),observacoes_estrategicas:item.observacoes_estrategicas||null});
const withLibraryParameters=(item:any)=>({...item,parametros_metodo:solutionParameters(item),investimento_recomendado:Number(item.investimento_minimo_recomendado||0)});
const motorPendingDefinitions=(resources:any[])=>{const enabled=resources.filter(item=>item.gera_pendencias!==false),names=enabled.map(item=>item.nome),hasAny=(values:string[])=>names.some(name=>values.some(value=>normalize(name).includes(normalize(value))||normalize(value).includes(normalize(name))));return[
 {codigo:'MARKETING_PARAMETROS',titulo:'Configurar Parâmetros de Marketing',when:['Google Ads','Meta Ads','Landing Page','Campanhas WhatsApp','Estratégia Comercial Digital']},
 {codigo:'CRM_PIPELINE',titulo:'Definir Pipeline Comercial',when:['CRM Comercial','CRM Avançado']},
 {codigo:'IA_ESCOPO',titulo:'Definir Escopo do Agente',when:['Agente de IA']},
 {codigo:'DASHBOARD_INDICADORES',titulo:'Definir Indicadores',when:['Dashboard Executivo']},
 {codigo:'WHATSAPP_NUMERO',titulo:'Validar Número do WhatsApp',when:['WhatsApp Oficial']}
].filter(item=>hasAny(item.when))};

export function composeGrowthProject({catalog,activeResources=[],priority='Organizar',baseClient=false,signals={}}:{catalog:any[];activeResources?:string[];priority?:string;baseClient?:boolean;signals?:DecisionSignals}){
 const scores=signals.pillarScores||{},scoreEntries=Object.entries(scores).filter(([,score])=>Number.isFinite(Number(score))),lowestPillar=scoreEntries.sort((a,b)=>Number(a[1])-Number(b[1]))[0]?.[0];
 const objective=pillarKey(signals.meetingPriority)||pillarKey(lowestPillar)||pillarKey(priority)||'organizar';
 const mandatory=baseClient?[]:BASE.map(name=>find(catalog,name)).filter(Boolean).filter(item=>!has(activeResources,item.nome)).map(item=>({...withLibraryParameters(item),classificacao:'Obrigatório' as GrowthClassification,origem:'Estrutura Base do Método',peso:10,fase:'Estrutura Obrigatória'}));
 const candidates=new Map<string,Candidate>();
 STRATEGY[objective].forEach((name,index)=>addCandidate(candidates,name,Math.max(5,9-index),`Prioridade calculada: ${objective}`));
 for(const [pillar,score] of scoreEntries){if(Number(score)>60)continue;(STRATEGY[pillarKey(pillar)||'']||[]).slice(0,3).forEach((name,index)=>addCandidate(candidates,name,8-index,`${pillar}: maturidade de ${Number(score)}%`))}
 const questionText=signals.questionScores||[];
 const weakQuestions=questionText.filter(item=>Number(item.valor)<=2),weakText=normalize(weakQuestions.map(item=>`${item.pilar} ${item.pergunta}`).join(' '));
 const openText=normalize((signals.openAnswers||[]).map((item:any)=>typeof item==='string'?item:`${item.pergunta||''} ${item.resposta||''}`).join(' '));
 const evidenceText=`${weakText}${openText}`;
 if(includesAny(evidenceText,['canais','origem','campanha','lead','oportunidade','divulgação','tráfego']))for(const name of ['Gestão Google Ads','Gestão Meta Ads','Landing Page','Campanhas WhatsApp'])addCandidate(candidates,name,10,'Diagnóstico aponta necessidade de aquisição e rastreio de oportunidades');
 if(includesAny(evidenceText,['centralizadas','responsável','distribuição','histórico','registrar','organização','controle']))for(const name of ['CRM Comercial','WhatsApp Oficial','Integrações','Dashboard Executivo'])addCandidate(candidates,name,10,'Diagnóstico aponta falha de organização comercial');
 if(includesAny(evidenceText,['retorno','andamento','etapas','paradas','acompanhamento','demora','esquec']))for(const name of ['CRM Comercial','Dashboard Executivo','Cadência Comercial','Automações'])addCandidate(candidates,name,10,'Diagnóstico aponta perda no acompanhamento das oportunidades');
 if(includesAny(evidenceText,['qualificar','conversão','motivos de perda','próximo passo','vendas']))for(const name of ['Treinamento Comercial','Agente de IA','Cadência Comercial','Qualificação'])addCandidate(candidates,name,10,'Diagnóstico aponta gargalo de conversão');
 if(includesAny(evidenceText,['indicadores','metas','prever','previsibilidade','dados','crescimento']))for(const name of ['Dashboard Executivo','Business Intelligence','Indicadores','Reuniões de Evolução'])addCandidate(candidates,name,10,'Diagnóstico aponta necessidade de gestão por indicadores');
 const hasMarketing=signals.possui_marketing===true||activeResources.some(name=>includesAny(normalize(name),['googleads','metaads','marketing']));
 const needsAcquisition=objective==='atrair'&&!hasMarketing&&(signals.possui_agencia!==true||signals.realiza_campanhas!==true);
 if(needsAcquisition)for(const name of ['Gestão Google Ads','Gestão Meta Ads','Landing Page','Campanhas WhatsApp','Estratégia Comercial Digital'])addCandidate(candidates,name,12,'Gatilho automático de aquisição: objetivo Atrair sem estrutura de Marketing identificada');
 for(const name of textList(signals.approvedRecommendations))addCandidate(candidates,name,100,'Solução validada na Reunião Estratégica');
 for(const name of textList(signals.newRecommendations))addCandidate(candidates,name,90,'Nova recomendação registrada na Reunião Estratégica');
 const removed=textList(signals.removedRecommendations);
 const unavailable=[...activeResources,...mandatory.map((item:any)=>item.nome)];
 let strategic=[...candidates.values()].filter(candidate=>!removed.some(name=>normalize(name)===normalize(candidate.name))).map(candidate=>{const item=find(catalog,candidate.name);return item?{...withLibraryParameters(item),classificacao:(candidate.weight>=8?'Recomendado':'Opcional') as GrowthClassification,origem:candidate.reasons.join(' · '),motivos_decisao:candidate.reasons,peso:candidate.weight,fase:candidate.weight>=8?'Recomendações Estratégicas':'Evoluções Futuras'}:null}).filter(Boolean).filter((item:any)=>!has(unavailable,item.nome));
 strategic.sort((a,b)=>b.peso-a.peso);
 const all=[...mandatory,...strategic],pendencies=motorPendingDefinitions(all);
 return{objective,baseClient,mandatory,strategic:strategic.filter((item:any)=>item.classificacao==='Recomendado'),future:strategic.filter((item:any)=>item.classificacao==='Opcional'),all,pendencies,nextActions:pendencies.map(item=>item.titulo),decisionEvidence:{pillarScores:scores,weakQuestions:weakQuestions.map(item=>item.pergunta),meetingPriority:signals.meetingPriority||null,approved:textList(signals.approvedRecommendations),removed},schedule:[{fase:'Estrutura Obrigatória',items:mandatory},{fase:'Recomendações Estratégicas',items:strategic.filter((item:any)=>item.classificacao==='Recomendado')},{fase:'Evoluções Futuras',items:strategic.filter((item:any)=>item.classificacao==='Opcional')}]};
}
