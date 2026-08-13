export type AdaptiveRecommendation={
 recomendacao_original?:string|null;
 recomendacao_validada?:string|null;
 recurso?:string|null;
 status_recurso?:string|null;
 adaptada?:boolean|null;
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
