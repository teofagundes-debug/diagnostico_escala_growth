export type CommercialSolution={id:string;codigo?:string;nome:string;tipo:'Implantação'|'Mensalidade'|'Implantação + Mensalidade';ui?:number|null;valor_mensal?:number|null;valor_mensalidade_padrao?:number|null;valor_implantacao_padrao?:number|null;impacta_financeiro?:boolean;[key:string]:any};
export type ResolvedPrice={valor_implantacao:number;valor_mensal:number;ui_utilizada:number;valor_ui_utilizado:number;fonte_mensalidade:'catalogo_recursos.valor_mensal'|'NAO_APLICAVEL'};

const amount=(value:unknown)=>Math.max(0,Number(value)||0);
const currency=(value:number)=>Math.round(value*100)/100;

/** Precificação canônica exclusiva para novos projetos do fluxo Estratégico 3.0. */
export function resolveCommercialPrice(solution:CommercialSolution,valorUi:unknown):ResolvedPrice{
 const financial=solution.impacta_financeiro!==false,type=solution.tipo,hasImplementation=type==='Implantação'||type==='Implantação + Mensalidade',hasMonthly=type==='Mensalidade'||type==='Implantação + Mensalidade',ui=hasImplementation?amount(solution.ui):0,unit=amount(valorUi);
 if(hasImplementation&&ui<=0)throw new Error(`A solução ${solution.nome} precisa possuir UI maior que zero.`);
 if(hasMonthly&&(solution.valor_mensal===null||solution.valor_mensal===undefined))throw new Error(`A solução ${solution.nome} precisa possuir valor_mensal na Biblioteca.`);
 return{valor_implantacao:financial&&hasImplementation?currency(ui*unit):0,valor_mensal:financial&&hasMonthly?currency(amount(solution.valor_mensal)):0,ui_utilizada:ui,valor_ui_utilizado:unit,fonte_mensalidade:hasMonthly?'catalogo_recursos.valor_mensal':'NAO_APLICAVEL'};
}

