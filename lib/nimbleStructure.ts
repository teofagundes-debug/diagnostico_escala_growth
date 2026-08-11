import type {CommercialSolution} from './commercialPricingResolver';

/** Fonte canônica da estrutura definida originalmente pela migration V34. */
export const NIMBLE_STRUCTURE_CODES = ['AUT-001','TRN-001','PLA-001'] as const;
export const NIMBLE_STRUCTURE_SOURCE = 'ESTRUTURA_CANONICA_PLATAFORMA_NIMBLE';

export function usesNimbleStructure(solution:CommercialSolution|null|undefined){
 const code=String(solution?.codigo||'').toUpperCase();
 return solution?.utiliza_plataforma_nimble===true&&!NIMBLE_STRUCTURE_CODES.includes(code as any);
}

export function resolveNimbleStructure(catalog:CommercialSolution[]){
 const byCode=new Map(catalog.map(item=>[String(item.codigo||'').toUpperCase(),item]));
 return NIMBLE_STRUCTURE_CODES.map(codigo=>byCode.get(codigo)).filter((item):item is CommercialSolution=>Boolean(item&&item.ativo!==false));
}
