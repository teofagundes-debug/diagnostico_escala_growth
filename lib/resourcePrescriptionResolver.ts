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
 state_code:'IMPLANTADO'|'PARCIALMENTE_IMPLANTADO'|'NAO_IMPLANTADO'|'NAO_INFORMADO';
 context_version:'1.0';
};

export type PostMeetingPrescription={
 original:string;
 validated:string;
 resource:string|null;
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

/** Interpreta a decisao validada na reuniao antes de qualquer associacao comercial. */
export function resolvePostMeetingPrescriptions(input:{confirmedRecommendations:string[];adaptiveRecommendations?:AdaptiveRecommendation[]|null;}):PostMeetingPrescription[]{
 const adaptive=Array.isArray(input.adaptiveRecommendations)?input.adaptiveRecommendations:[],structured=adaptive.length>0;
 return input.confirmedRecommendations.map(original=>{
  const match=adaptive.find(item=>normalize(item.recomendacao_original)===normalize(original));
  if(!structured||!match)return{original,validated:original,resource:null,resource_status:null,adapted:false,commercial_eligible:true,decision:'PRESCREVER_SOLUCAO',reason:'Compatibilidade legada: recomendacao adaptativa estruturada ausente.'};
  const validated=String(match.recomendacao_validada||original).trim()||original,status=String(match.status_recurso||'').trim()||null,adapted=match.adaptada===true||normalize(validated)!==normalize(original),existing=status?existingStates.has(normalize(status)):false,isEvolution=evolutionLanguage.test(normalize(validated));
  const preserveOnly=existing&&adapted&&(normalize(status)==='parcialmente implantado'||isEvolution);
  return{original,validated,resource:match.recurso?String(match.recurso):null,resource_status:status,adapted,commercial_eligible:!preserveOnly,decision:preserveOnly?'MANTER_ACAO_ESTRATEGICA':'PRESCREVER_SOLUCAO',reason:preserveOnly?`Recurso ${status?.toLowerCase()}; a recomendacao validada representa conclusao, otimizacao ou evolucao do que ja existe.`:'Recomendacao validada elegivel para associacao comercial.'};
 });
}

/** Materializa IDs canônicos uma única vez, na conclusão da revisão. */
export function materializeContextualPrescriptions(input:{prescriptions:PostMeetingPrescription[];catalog:any[];links?:any[]}):ContextualPrescription[]{
 const links=Array.isArray(input.links)?input.links:[];
 return input.prescriptions.map(item=>{
  const explicitId=String((item as any).solucao_id||(item as any).recurso_id||'').trim(),explicitCode=String((item as any).recurso_codigo||canonicalCodeByResource[normalize(item.resource)]||'').toUpperCase(),solution=input.catalog.find(row=>explicitId&&String(row.id)===explicitId)||input.catalog.find(row=>explicitCode&&String(row.codigo||'').toUpperCase()===explicitCode)||null;
  const solutionId=solution?.id?String(solution.id):null;
  return{...item,canonical_resource_id:solutionId,canonical_solution_id:item.commercial_eligible?solutionId:null,canonical_solution_code:solution?.codigo?String(solution.codigo):null,intervention_codes:solutionId?[...new Set(links.filter(link=>link.ativo!==false&&String(link.solucao_id)===solutionId).map(link=>String(link.intervention_code)).filter(Boolean))]:[],state_code:stateCode(item.resource_status),context_version:'1.0'};
 });
}

export function contextualActionIsEligible(action:any,prescriptions:ContextualPrescription[]|null|undefined){
 const blocked=(Array.isArray(prescriptions)?prescriptions:[]).filter(item=>item.commercial_eligible===false),intervention=String(action?.intervention_code||action?.recommended_snapshot?.intervention_code||'');
 return !blocked.some(item=>item.intervention_codes.includes(intervention));
}
