export type AdaptiveRecommendation={
 recomendacao_original?:string|null;
 recomendacao_validada?:string|null;
 recurso?:string|null;
 recurso_id?:string|null;
 recurso_codigo?:string|null;
 solucao_id?:string|null;
 status_recurso?:string|null;
 adaptada?:boolean|null;
};

export type ContextualPrescription=PostMeetingPrescription&{
 canonical_resource_id:string|null;
 canonical_solution_id:string|null;
 canonical_solution_code:string|null;
 intervention_codes:string[];
 superseded_intervention_codes?:string[];
 state_code:'IMPLANTADO'|'PARCIALMENTE_IMPLANTADO'|'NAO_IMPLANTADO'|'NAO_INFORMADO';
 context_version:'1.0';
};

export type ContextualDecisionType='OTIMIZAR'|'CONCLUIR'|'IMPLANTAR'|'MANTER'|'NAO_PRESCREVER';
export type ConsolidatedContextualPrescription=ContextualPrescription&{
 contextual_action_key:string;
 contextual_decision_type:ContextualDecisionType;
 supporting_prescriptions:ContextualPrescription[];
};

export type PostMeetingPrescription={
 original:string;
 validated:string;
 resource:string|null;
 resource_id?:string|null;
 resource_code?:string|null;
 solution_id?:string|null;
 resource_status:string|null;
 adapted:boolean;
 commercial_eligible:boolean;
 decision:'PRESCREVER_SOLUCAO'|'MANTER_ACAO_ESTRATEGICA';
 reason:string;
};

const normalize=(value:unknown)=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const existingStates=new Set(['implantado','parcialmente implantado']);
const evolutionLanguage=/(otimiz|evolu|conclu|padroniz|revis|ampli|consolid|rotina|aprimor|fortalec|melhor)/;
const canonicalCodeByResource:Record<string,string>={
 'agente de ia':'IA-001',crm:'CRM-001','whatsapp oficial':'WPP-001',dashboard:'DAT-001',integracoes:'INT-001'
};
const stateCode=(value:unknown):ContextualPrescription['state_code']=>{const state=normalize(value);if(state==='implantado')return'IMPLANTADO';if(state==='parcialmente implantado')return'PARCIALMENTE_IMPLANTADO';if(['nao implantado','nao possui'].includes(state))return'NAO_IMPLANTADO';return'NAO_INFORMADO'};
const keyPart=(value:unknown)=>normalize(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'nao-informado';

export function contextualDecisionType(item:PostMeetingPrescription):ContextualDecisionType{
 const value=normalize(item.validated);
 if(/nao prescrev|nao recomendar|dispensar|remover/.test(value))return'NAO_PRESCREVER';
 if(/conclu|finaliz|completar/.test(value))return'CONCLUIR';
 if(/otimiz|evolu|aprimor|melhor|ampli|fortalec|padroniz|revis|consolid|rotina/.test(value))return'OTIMIZAR';
 if(item.decision==='PRESCREVER_SOLUCAO')return'IMPLANTAR';
 return'MANTER';
}

/** Identidade funcional da decisão; evidências diferentes podem sustentar a mesma ação. */
export function contextualActionKey(item:ContextualPrescription){
 const resource=item.canonical_resource_id||item.canonical_solution_code||item.resource||'sem-recurso';
 return['contextual-v1',keyPart(resource),contextualDecisionType(item),keyPart(item.validated),'revisao-estrategica'].join(':');
}

export function consolidateContextualPrescriptions(items:ContextualPrescription[]):ConsolidatedContextualPrescription[]{
 const grouped=new Map<string,ConsolidatedContextualPrescription>();
 for(const item of items){
  const contextual_action_key=contextualActionKey(item),current=grouped.get(contextual_action_key);
  if(!current){grouped.set(contextual_action_key,{...item,intervention_codes:[...new Set(item.intervention_codes||[])],contextual_action_key,contextual_decision_type:contextualDecisionType(item),supporting_prescriptions:[item]});continue}
  current.intervention_codes=[...new Set([...current.intervention_codes,...(item.intervention_codes||[])])];
  current.supporting_prescriptions.push(item);
 }
 return[...grouped.values()];
}

/** Interpreta a decisao validada na reuniao antes de qualquer associacao comercial. */
export function resolvePostMeetingPrescriptions(input:{confirmedRecommendations:string[];adaptiveRecommendations?:AdaptiveRecommendation[]|null;}):PostMeetingPrescription[]{
 const adaptive=Array.isArray(input.adaptiveRecommendations)?input.adaptiveRecommendations:[],structured=adaptive.length>0;
 return input.confirmedRecommendations.map(original=>{
  const match=adaptive.find(item=>normalize(item.recomendacao_original)===normalize(original));
  if(!structured||!match)return{original,validated:original,resource:null,resource_id:null,resource_code:null,solution_id:null,resource_status:null,adapted:false,commercial_eligible:true,decision:'PRESCREVER_SOLUCAO',reason:'Compatibilidade legada: recomendacao adaptativa estruturada ausente.'};
  const validated=String(match.recomendacao_validada||original).trim()||original,status=String(match.status_recurso||'').trim()||null,adapted=match.adaptada===true||normalize(validated)!==normalize(original),existing=status?existingStates.has(normalize(status)):false,isEvolution=evolutionLanguage.test(normalize(validated));
  const preserveOnly=existing&&adapted&&(normalize(status)==='parcialmente implantado'||isEvolution);
  return{original,validated,resource:match.recurso?String(match.recurso):null,resource_id:match.recurso_id?String(match.recurso_id):null,resource_code:match.recurso_codigo?String(match.recurso_codigo):null,solution_id:match.solucao_id?String(match.solucao_id):null,resource_status:status,adapted,commercial_eligible:!preserveOnly,decision:preserveOnly?'MANTER_ACAO_ESTRATEGICA':'PRESCREVER_SOLUCAO',reason:preserveOnly?`Recurso ${status?.toLowerCase()}; a recomendacao validada representa conclusao, otimizacao ou evolucao do que ja existe.`:'Recomendacao validada elegivel para associacao comercial.'};
 });
}

/** Materializa IDs canônicos uma única vez, na conclusão da revisão. */
export function materializeContextualPrescriptions(input:{prescriptions:PostMeetingPrescription[];catalog:any[];links?:any[]}):ContextualPrescription[]{
 const links=Array.isArray(input.links)?input.links:[];
 return input.prescriptions.map(item=>{
  const explicitId=String(item.solution_id||item.resource_id||'').trim(),explicitCode=String(item.resource_code||canonicalCodeByResource[normalize(item.resource)]||'').toUpperCase(),solution=input.catalog.find(row=>explicitId&&String(row.id)===explicitId)||input.catalog.find(row=>explicitCode&&String(row.codigo||'').toUpperCase()===explicitCode)||null;
  const solutionId=solution?.id?String(solution.id):null;
  return{...item,canonical_resource_id:solutionId,canonical_solution_id:item.commercial_eligible?solutionId:null,canonical_solution_code:solution?.codigo?String(solution.codigo):null,intervention_codes:solutionId?[...new Set(links.filter(link=>link.ativo!==false&&String(link.solucao_id)===solutionId).map(link=>String(link.intervention_code)).filter(Boolean))]:[],superseded_intervention_codes:[],state_code:stateCode(item.resource_status),context_version:'1.0'};
 });
}

export function contextualActionIsEligible(action:any,prescriptions:ContextualPrescription[]|null|undefined){
 const contextual=Array.isArray(prescriptions)?prescriptions:[],snapshot=action?.recommended_snapshot||action||{},interventions=[action?.intervention_code,snapshot?.intervention_code,...(Array.isArray(snapshot?.intervention_codes)?snapshot.intervention_codes:[])].map(String).filter(Boolean);
 return !contextual.some(item=>(item.superseded_intervention_codes||[]).some(code=>interventions.includes(String(code))));
}

export function isContextualExecutionAction(action:any){return action?.action_origin==='CONTEXTUAL'||Boolean(action?.contextual_action_key)||action?.recommended_snapshot?.source==='REVISAO_ESTRATEGICA'||Boolean(action?.recommended_snapshot?.contextual_action_key)}

/** Herda apenas Motor elegível e ações manuais independentes. Contexto é sempre rematerializado. */
export function actionsPreservedForRevision(actions:any[],prescriptions:ContextualPrescription[]){
 return(Array.isArray(actions)?actions:[]).filter(action=>!isContextualExecutionAction(action)&&(action?.source_type!=='ENGINE'||contextualActionIsEligible(action,prescriptions)));
}
