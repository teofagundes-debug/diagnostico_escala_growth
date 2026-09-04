import {resolveFormalizationContext,type FormalizationIdentity} from './formalizationContext.ts';

export type FinancialRecord={id:string;empresa_id:string;formalizacao_id?:string|null;updated_at?:string;[key:string]:unknown};

export function resolveFinancialContext(input:{
 companyId:string;
 financials?:FinancialRecord[];
 formalizations?:FormalizationIdentity[];
 formalizationId?:string|null;
 projectEvolutionId?:string|null;
 allowLegacy?:boolean;
}){
 const financials=(input.financials||[]).filter(row=>String(row.empresa_id)===String(input.companyId));
 const context=resolveFormalizationContext({formalizationId:input.formalizationId,companyId:input.companyId,origin:'ESCALA_GROWTH',originId:input.projectEvolutionId,formalizations:input.formalizations,legacyProjectId:input.projectEvolutionId});
 if(context?.formalization){
  const financial=financials.find(row=>String(row.formalizacao_id||'')===context.formalization!.id)||null;
  return{formalization:context.formalization,financial,resolution:context.resolution,legacy:false};
 }
 if(input.formalizationId)return null;
 const growthFormalizations=(input.formalizations||[]).filter(row=>row.empresa_id===input.companyId&&row.origem==='ESCALA_GROWTH');
 if(!input.projectEvolutionId&&growthFormalizations.length===1){const formalization=growthFormalizations[0],financial=financials.find(row=>row.formalizacao_id===formalization.id)||null;return{formalization,financial,resolution:'UNIQUE_GROWTH_CONTEXT' as const,legacy:false}}
 const legacy=financials.filter(row=>!row.formalizacao_id);
 if(input.allowLegacy!==false&&legacy.length===1)return{formalization:null,financial:legacy[0],resolution:'LEGACY_FINANCIAL' as const,legacy:true};
 if(input.allowLegacy!==false&&legacy.length>1)return{formalization:null,financial:null,resolution:'LEGACY_AMBIGUOUS' as const,legacy:true};
 return null;
}

export function financialMutationPath(record:FinancialRecord){
 if(!record?.id)throw new Error('Financeiro não resolvido para atualização segura.');
 return `financeiro_growth?id=eq.${encodeURIComponent(record.id)}`;
}

export function modernFinancialPayload<T extends Record<string,unknown>>(payload:T,formalizationId:string){
 if(!formalizationId)throw new Error('formalizacao_id é obrigatório para um financeiro moderno.');
 return{...payload,formalizacao_id:formalizationId};
}

type DataAccess=(path:string,init?:RequestInit)=>Promise<any>;

export async function loadGrowthFinancial(db:DataAccess,input:{companyId:string;formalizationId?:string|null;projectEvolutionId?:string|null;allowLegacy?:boolean}){
 const company=encodeURIComponent(input.companyId),[financials,formalizations]=await Promise.all([
  db(`financeiro_growth?empresa_id=eq.${company}&select=*&order=updated_at.desc`),
  db(`formalizacoes?empresa_id=eq.${company}&origem=eq.ESCALA_GROWTH&select=*&order=versao.desc`)
 ]);
 return resolveFinancialContext({...input,financials:financials||[],formalizations:formalizations||[]});
}

export async function saveGrowthFinancial(db:DataAccess,input:{companyId:string;payload:Record<string,unknown>;formalizationId?:string|null;projectEvolutionId?:string|null;allowLegacy?:boolean}){
 const context=await loadGrowthFinancial(db,input),formalizationId=context?.formalization?.id||input.formalizationId||null,payload={...input.payload,empresa_id:input.companyId,...(formalizationId?{formalizacao_id:formalizationId}:{})};
 if(context?.resolution==='LEGACY_AMBIGUOUS')throw new Error('Existem múltiplos financeiros históricos sem formalização; informe a formalização antes de atualizar.');
 if(context?.financial){await db(financialMutationPath(context.financial),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});return{...context,financial:{...context.financial,...payload}}}
 const created=await db('financeiro_growth',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
 return{formalization:context?.formalization||null,financial:Array.isArray(created)?created[0]:created,resolution:formalizationId?'CREATED_MODERN':'CREATED_LEGACY',legacy:!formalizationId};
}
