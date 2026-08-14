import type {CommercialSolution} from './commercialPricingResolver';

export type ExistingResourceState='CONTRATADO_VIGENTE'|'IMPLANTADO'|'PARCIALMENTE_IMPLANTADO'|'EVOLUCAO';
export type CanonicalExistingResource={recurso_id:string;solution:CommercialSolution;state:ExistingResourceState;sources:string[];recurring:boolean};
const list=(value:unknown):any[]=>Array.isArray(value)?value:[];
const normalize=(value:unknown)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const evolutionLanguage=/(OTIMIZ|EVOLU|AMPLI|MELHOR|APERFEICO|FORTALEC)/i;
const rank:Record<ExistingResourceState,number>={PARCIALMENTE_IMPLANTADO:1,EVOLUCAO:2,IMPLANTADO:3,CONTRATADO_VIGENTE:4};

/** Consolida somente IDs/códigos canônicos; rótulos livres não influenciam contratação. */
export function resolveCanonicalExistingResources(input:{catalog:CommercialSolution[];commercialResources?:unknown;adaptiveRecommendations?:unknown}):CanonicalExistingResource[]{
 const byId=new Map(input.catalog.map(item=>[item.id,item])),byCode=new Map(input.catalog.filter(item=>item.codigo).map(item=>[normalize(item.codigo),item])),resolved=new Map<string,CanonicalExistingResource>();
 const add=(solution:CommercialSolution|undefined,state:ExistingResourceState,source:string)=>{if(!solution)return;const current=resolved.get(solution.id);if(!current){resolved.set(solution.id,{recurso_id:solution.id,solution,state,sources:[source],recurring:solution.tipo!=='Implantação'});return}if(!current.sources.includes(source))current.sources.push(source);if(rank[state]>rank[current.state])current.state=state};
 for(const resource of list(input.commercialResources)){const id=String(resource?.recurso_id||resource?.solucao_id||'');add(byId.get(id),'CONTRATADO_VIGENTE','SITUACAO_COMERCIAL_VIGENTE')}
 for(const recommendation of list(input.adaptiveRecommendations)){const status=normalize(recommendation?.status_recurso),solution=byId.get(String(recommendation?.recurso_id||recommendation?.solucao_id||''))||byCode.get(normalize(recommendation?.recurso_codigo));if(status==='PARCIALMENTE_IMPLANTADO')add(solution,'PARCIALMENTE_IMPLANTADO','REVISAO_ESTRATEGICA');else if(status==='IMPLANTADO'){const validated=String(recommendation?.recomendacao_validada||'');add(solution,evolutionLanguage.test(validated)?'EVOLUCAO':'IMPLANTADO','REVISAO_ESTRATEGICA')}}
 return[...resolved.values()];
}

export function existingResourceClassification(resource?:CanonicalExistingResource|null){if(!resource)return'NOVA_CONTRATACAO' as const;if(resource.state==='PARCIALMENTE_IMPLANTADO')return'PARCIALMENTE_IMPLANTADO' as const;if(resource.state==='EVOLUCAO')return'EVOLUCAO' as const;return'JA_EXISTENTE' as const}
