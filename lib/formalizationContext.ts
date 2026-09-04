export const FORMALIZATION_ORIGINS=['ESCALA_GROWTH','IMPLANTACAO_FERRAMENTAS'] as const;
export type FormalizationOrigin=typeof FORMALIZATION_ORIGINS[number];

export type FormalizationIdentity={
 id:string; empresa_id:string; origem:FormalizationOrigin; origem_id:string; versao:number; status:string;
};

type ResolveInput={
 formalizationId?:string|null;
 companyId:string;
 origin?:FormalizationOrigin|null;
 originId?:string|null;
 version?:number|null;
 formalizations?:FormalizationIdentity[];
 legacyProjectId?:string|null;
};

export function formalizationKey(origin:FormalizationOrigin,originId:string,version=1){
 return `${origin}:${originId}:${version}`;
}

export function resolveFormalizationContext(input:ResolveInput){
 const rows=(input.formalizations||[]).filter(row=>String(row.empresa_id)===String(input.companyId));
 if(input.formalizationId){
  const explicit=rows.find(row=>String(row.id)===String(input.formalizationId));
  return explicit?{formalization:explicit,resolution:'EXPLICIT' as const}:null;
 }
 if(input.origin&&input.originId){
  const exact=rows.find(row=>row.origem===input.origin&&String(row.origem_id)===String(input.originId)&&Number(row.versao)===Number(input.version||1));
  return exact?{formalization:exact,resolution:'ORIGIN' as const}:null;
 }
 if(input.legacyProjectId){
  const growth=rows.find(row=>row.origem==='ESCALA_GROWTH'&&String(row.origem_id)===String(input.legacyProjectId));
  return growth?{formalization:growth,resolution:'LEGACY_PROJECT' as const}:{formalization:null,resolution:'LEGACY_FALLBACK' as const};
 }
 return null;
}

export function selectFormalizationRecord<T extends {formalizacao_id?:string|null;projeto_evolucao_id?:string|null}>(records:T[],context:ReturnType<typeof resolveFormalizationContext>){
 if(context?.formalization){
  const linked=records.filter(row=>String(row.formalizacao_id||'')===context.formalization.id);
  return linked[0]||null;
 }
 if(context?.resolution==='LEGACY_FALLBACK')return records.find(row=>!row.formalizacao_id)||records[0]||null;
 return null;
}
