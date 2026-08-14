export type GrowthClassification='Obrigatório'|'Recomendado'|'Opcional';

const normalize=(value:unknown)=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const compact=(value:unknown)=>normalize(value).replace(/\s/g,'');
const list=(value:unknown):any[]=>Array.isArray(value)?value:value===null||value===undefined||value===''?[]:[value];
const textList=(value:unknown):string[]=>list(value).flatMap(item=>{if(typeof item==='string'){const trimmed=item.trim();if(trimmed.startsWith('[')||trimmed.startsWith('{')){try{return textList(JSON.parse(trimmed))}catch{}}return item.split(/[\n,;]+/)}if(item?.nome)return[item.nome];if(item&&typeof item==='object')return Object.values(item).flatMap(textList);return[]}).map(item=>String(item).trim()).filter(Boolean);
const sameSolution=(a:unknown,b:unknown)=>{const left=compact(a),right=compact(b);return left===right||left.includes(right)||right.includes(left)};
const find=(catalog:any[],name:string)=>catalog.find(item=>sameSolution(item.nome,name))||null;
const has=(names:string[],name:string)=>names.some(current=>sameSolution(current,name));
const pillarKey=(value:unknown)=>['atrair','organizar','acompanhar','converter','crescer'].find(key=>normalize(value).includes(key));
const tokens=(value:unknown)=>textList(value).flatMap(item=>normalize(item).split(/\s+/)).filter(item=>item.length>=4);

type DecisionSignals={
 pillarScores?:Record<string,number>;
 questionScores?:Array<{pilar?:string;pergunta?:string;valor?:number}>;
 openAnswers?:Array<{pergunta?:string;resposta?:string}>|string[];
 meetingPriority?:string;
 approvedRecommendations?:unknown;
 removedRecommendations?:unknown;
 newRecommendations?:unknown;
 [key:string]:unknown;
};
type Candidate={item:any;weight:number;reasons:string[]};
type ExistingResourceInput={recurso_id:string;solution:any;state:'CONTRATADO_VIGENTE'|'IMPLANTADO'|'PARCIALMENTE_IMPLANTADO'|'EVOLUCAO';sources?:string[]};
export type DocumentaryNextStep={recurso_id:string;codigo:string|null;nome:string;classificacao:'NOVA_CONTRATACAO'|'EVOLUCAO'|'PARCIALMENTE_IMPLANTADO';origem:string[];acao:string;fase:string};

export const solutionParameters=(item:any)=>({
 objetivo_padrao:item.objetivo_padrao||null,resultado_esperado:item.resultado_esperado||null,
 criterios_recomendacao:list(item.criterios_recomendacao),quando_recomendar:item.quando_recomendar||null,quando_nao_recomendar:item.quando_nao_recomendar||null,
 tipo:item.tipo||'Implantação',recorrencia_ativa_apos_implantacao:item.tipo==='Implantação + Mensalidade',tempo_medio_implantacao:item.tipo==='Mensalidade'?null:(item.tempo_medio_implantacao||null),
 ordem_implantacao:item.tipo==='Mensalidade'?null:(item.ordem_implantacao||null),semana_sugerida:item.tipo==='Mensalidade'?null:(item.semana_sugerida||null),duracao_padrao:item.tipo==='Mensalidade'?null:(item.tempo_medio_implantacao||item.duracao_padrao||null),
 treinamento_obrigatorio:item.treinamento_obrigatorio===true,gera_pendencias:item.gera_pendencias===true,codigo_pendencia_padrao:item.codigo_pendencia_padrao||null,titulo_pendencia_padrao:item.titulo_pendencia_padrao||null,rota_configuracao_padrao:item.rota_configuracao_padrao||null,
 abre_planejamento_operacional:item.abre_planejamento_operacional===true,permite_executor_terceiro:item.permite_executor_terceiro!==false,permite_equipe_interna:item.permite_equipe_interna!==false,
 impacta_financeiro:item.impacta_financeiro!==false,impacta_cronograma:item.impacta_cronograma!==false,impacta_implantacao:item.impacta_implantacao!==false,cria_checklist:item.cria_checklist===true,disponivel_evolucao_futura:item.disponivel_evolucao_futura!==false,
 utiliza_investimento_recomendado:item.utiliza_investimento_recomendado===true,investimento_minimo_recomendado:item.utiliza_investimento_recomendado===true?Number(item.investimento_minimo_recomendado||0):0,
 valor_implantacao_padrao:item.valor_implantacao_padrao==null?null:Number(item.valor_implantacao_padrao),valor_mensalidade_padrao:item.valor_mensalidade_padrao==null?null:Number(item.valor_mensalidade_padrao),
 recursos_relacionados:list(item.recursos_relacionados),dependencias_estruturadas:list(item.dependencias_estruturadas),criterios_conclusao:list(item.criterios_conclusao),entregas_padrao:list(item.entregas_padrao),
 observacoes_estrategicas:item.observacoes_estrategicas||null
});
const withLibraryParameters=(item:any)=>({...item,parametros_metodo:solutionParameters(item),investimento_recomendado:item.utiliza_investimento_recomendado===true?Number(item.investimento_minimo_recomendado||0):0});
const pendingCode=(item:any)=>`SOLUCAO_${String(item.codigo||item.id||item.nome).toUpperCase().replace(/[^A-Z0-9]+/g,'_')}`;

export function composeGrowthProject({catalog,activeResources=[],existingResources=[],priority='Organizar',baseClient=false,signals={}}:{catalog:any[];activeResources?:string[];existingResources?:ExistingResourceInput[];priority?:string;baseClient?:boolean;signals?:DecisionSignals}){
 const scores=signals.pillarScores||{},scoreEntries=Object.entries(scores).filter(([,score])=>Number.isFinite(Number(score))),lowestPillar=[...scoreEntries].sort((a,b)=>Number(a[1])-Number(b[1]))[0]?.[0];
 const objective=pillarKey(signals.meetingPriority)||pillarKey(lowestPillar)||pillarKey(priority)||'organizar';
 const activeCatalog=catalog.filter(item=>item.ativo!==false);
 const existingById=new Map(existingResources.map(item=>[String(item.recurso_id),item]));
 const resourceClass=(item:any)=>{const existing=existingById.get(String(item.id));if(existing?.state==='PARCIALMENTE_IMPLANTADO')return'PARCIALMENTE_IMPLANTADO' as const;if(existing?.state==='EVOLUCAO')return'EVOLUCAO' as const;if(existing)return'JA_EXISTENTE' as const;return has(activeResources,item.nome)?'JA_EXISTENTE' as const:'NOVA_CONTRATACAO' as const};
 const mandatory=baseClient?[]:activeCatalog.filter(item=>item.classificacao_comercial==='Obrigatória'&&resourceClass(item)==='NOVA_CONTRATACAO').map(item=>({...withLibraryParameters(item),classificacao:'Obrigatório' as GrowthClassification,origem:'Estrutura Obrigatória definida na Biblioteca',peso:10,fase:'Estrutura Obrigatória'}));
 const weakQuestions=(signals.questionScores||[]).filter(item=>Number(item.valor)<=2);
 const evidence=[objective,priority,signals.meetingPriority,weakQuestions.map(item=>`${item.pilar||''} ${item.pergunta||''}`),(signals.openAnswers||[]).map((item:any)=>typeof item==='string'?item:`${item.pergunta||''} ${item.resposta||''}`)].flat(Infinity).join(' ');
 const evidenceNormalized=normalize(evidence),removed=textList(signals.removedRecommendations),approved=[...textList(signals.approvedRecommendations),...textList(signals.newRecommendations)];
 const candidates=new Map<string,Candidate>();
 const add=(item:any,weight:number,reason:string)=>{const key=compact(item.nome),current=candidates.get(key);if(!current||weight>current.weight)candidates.set(key,{item,weight,reasons:[...(current?.reasons||[]),reason]});else if(!current.reasons.includes(reason))current.reasons.push(reason)};
 for(const item of activeCatalog){
  if(mandatory.some((required:any)=>required.id===item.id)||resourceClass(item)!=='NOVA_CONTRATACAO'||removed.some(name=>sameSolution(name,item.nome)))continue;
  const excluded=tokens(item.quando_nao_recomendar).some(token=>evidenceNormalized.includes(token));if(excluded)continue;
  const criteria=tokens(item.criterios_recomendacao),matched=criteria.filter(token=>evidenceNormalized.includes(token));
  const whenMatched=tokens(item.quando_recomendar).filter(token=>evidenceNormalized.includes(token));
  if(matched.length||whenMatched.length)add(item,Math.min(10,5+matched.length+whenMatched.length),`Critérios da Biblioteca correspondem ao diagnóstico (${[...matched,...whenMatched].join(', ')})`);
  if(approved.some(name=>sameSolution(name,item.nome)))add(item,10,'Solução validada na Reunião Estratégica');
 }
 const strategic=[...candidates.values()].map(({item,weight,reasons})=>({...withLibraryParameters(item),classificacao:(weight>=8?'Recomendado':'Opcional') as GrowthClassification,origem:reasons.join(' · '),motivos_decisao:reasons,peso:weight,fase:weight>=8?'Recomendações Estratégicas':'Evoluções Futuras'})).sort((a,b)=>b.peso-a.peso);
 const all=[...mandatory,...strategic];
 const newSteps:DocumentaryNextStep[]=all.map((item:any)=>({recurso_id:String(item.id),codigo:item.codigo||null,nome:item.nome,classificacao:'NOVA_CONTRATACAO',origem:[String(item.origem||'Motor de Crescimento')],acao:item.nome,fase:item.fase}));
 const contextualSteps:DocumentaryNextStep[]=existingResources.flatMap(existing=>{const solution=existing.solution;if(!solution)return[];if(existing.state==='EVOLUCAO')return[{recurso_id:String(existing.recurso_id),codigo:solution.codigo||null,nome:solution.nome,classificacao:'EVOLUCAO' as const,origem:existing.sources||['REVISAO_ESTRATEGICA'],acao:`Evoluir e otimizar ${solution.nome}`,fase:'Evolução de recurso existente'}];if(existing.state==='PARCIALMENTE_IMPLANTADO')return[{recurso_id:String(existing.recurso_id),codigo:solution.codigo||null,nome:solution.nome,classificacao:'PARCIALMENTE_IMPLANTADO' as const,origem:existing.sources||['REVISAO_ESTRATEGICA'],acao:`Definir a conclusão ou evolução de ${solution.nome}`,fase:'Decisão pendente'}];return[]});
 const documentaryNextSteps=[...newSteps,...contextualSteps].filter((item,index,items)=>items.findIndex(other=>other.recurso_id===item.recurso_id&&other.classificacao===item.classificacao)===index);
 const pendencies=[...all.filter((item:any)=>item.gera_pendencias===true).reduce((map:Map<string,any>,item:any)=>{const codigo=item.codigo_pendencia_padrao||pendingCode(item),current=map.get(codigo);map.set(codigo,{codigo,titulo:item.titulo_pendencia_padrao||`Configurar ${item.nome}`,recurso_id:item.id,solucoes:[...(current?.solucoes||[]),item.nome]});return map},new Map()).values()];
 return{objective,baseClient,mandatory,strategic:strategic.filter(item=>item.classificacao==='Recomendado'),future:strategic.filter(item=>item.classificacao==='Opcional'),all,documentaryNextSteps,pendencies,nextActions:pendencies.map(item=>item.titulo),decisionEvidence:{pillarScores:scores,weakQuestions:weakQuestions.map(item=>item.pergunta),meetingPriority:signals.meetingPriority||null,approved,removed},schedule:[{fase:'Estrutura Obrigatória',items:mandatory.filter((item:any)=>item.impacta_cronograma!==false)},{fase:'Recomendações Estratégicas',items:strategic.filter((item:any)=>item.classificacao==='Recomendado'&&item.impacta_cronograma!==false)},{fase:'Evoluções Futuras',items:strategic.filter((item:any)=>item.classificacao==='Opcional'&&item.impacta_cronograma!==false)}]};
}
