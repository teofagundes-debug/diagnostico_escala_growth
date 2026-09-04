/* eslint-disable @typescript-eslint/no-explicit-any */
import {resolveCommercialPrice} from './commercialPricingResolver.ts';

export type ToolCommercialItem={resource_id:string;codigo:string;nome:string;categoria:string;unidade:string;quantidade:number;tipo:string;ui_unitaria:number;valor_ui:number;valor_mensal_unitario:number;subtotal_implantacao:number;subtotal_mensal:number;origens:string[];captured_at:string};

const quantity=(value:any)=>Math.max(1,Math.round(Number(value)||1));
const hasCondition=(mapping:any,configuration:any)=>mapping.condition_type!=='CHANNEL'||[
 ...(configuration?.ai_agent?.channels||[]),...(configuration?.service_automation?.channels||[])
].some((value:string)=>String(value).toLowerCase()===String(mapping.condition_value).toLowerCase());

export function mappedResourceRequests(configuration:any,mappings:any[]){
 const selected=new Set((configuration?.solutions||[]).map((item:any)=>item.id));
 const requests=new Map<string,{resource_id:string;quantity:number;unit:string;origins:string[]}>();
 for(const mapping of mappings.filter(item=>item.ativo!==false&&selected.has(item.solution_type)&&hasCondition(item,configuration))){
  const current=requests.get(mapping.recurso_id);
  if(current){current.origins=[...new Set([...current.origins,mapping.solution_type])];continue}
  requests.set(mapping.recurso_id,{resource_id:mapping.recurso_id,quantity:quantity(mapping.quantidade_padrao),unit:mapping.unidade_comercial||'unidade',origins:[mapping.solution_type]});
 }
 return [...requests.values()];
}

export function priceToolResources(requests:any[],catalog:any[],valorUi:any,previous:any[]=[],refresh=false){
 const previousById=new Map(previous.map(item=>[item.resource_id,item])),now=new Date().toISOString();
 const items:ToolCommercialItem[]=[];
 for(const request of requests){
  const resource=catalog.find(item=>item.id===request.resource_id);
  if(!resource)throw new Error('Um recurso comercial selecionado não existe mais no catálogo.');
  const old=previousById.get(resource.id),qty=quantity(request.quantity);
  if(old&&!refresh){items.push({...old,quantidade:qty,origens:[...new Set([...(old.origens||[]),...(request.origins||[])])],subtotal_implantacao:Number(old.ui_unitaria||0)*Number(old.valor_ui||0)*qty,subtotal_mensal:Number(old.valor_mensal_unitario||0)*qty});continue}
  if(resource.ativo===false)throw new Error(`O recurso ${resource.nome} está inativo no catálogo.`);
  const canonical={...resource,tipo:resource.tipo_comercial||resource.tipo,valor_mensal:resource.valor_mensalidade_padrao??resource.valor_mensal},price=resolveCommercialPrice(canonical,valorUi);
  items.push({resource_id:resource.id,codigo:resource.codigo,nome:resource.nome,categoria:resource.categoria,unidade:request.unit||'unidade',quantidade:qty,tipo:canonical.tipo,ui_unitaria:price.ui_utilizada,valor_ui:price.valor_ui_utilizado,valor_mensal_unitario:price.valor_mensal,subtotal_implantacao:price.valor_implantacao*qty,subtotal_mensal:price.valor_mensal*qty,origens:request.origins||['CONSULTOR'],captured_at:now});
 }
 return items;
}

export function toolCommercialTotals(items:ToolCommercialItem[]){return{investimento_inicial:items.reduce((sum,item)=>sum+Number(item.subtotal_implantacao||0),0),licencas_mensais:items.reduce((sum,item)=>sum+Number(item.subtotal_mensal||0),0)}}
export function toolCommercialSnapshot(items:ToolCommercialItem[],parameters:any){return{version:1,captured_at:new Date().toISOString(),valor_ui:Number(parameters?.valor_ui||0),items,totals:toolCommercialTotals(items)}}

export function validateToolScopeResolutions(solutionIds:string[],resolutions:any[],items:ToolCommercialItem[]){
 const pending=solutionIds.filter(id=>['PROCESS_AUTOMATION','SYSTEM_INTEGRATION'].includes(id)),itemIds=new Set(items.map(item=>item.resource_id)),errors:string[]=[];
 for(const solutionId of pending){const resolution=resolutions.find(item=>item.solution_type===solutionId);if(!resolution?.definition?.trim())errors.push(`${solutionId}: informe o escopo definido na reunião.`);if(!resolution?.resource_id||!itemIds.has(resolution.resource_id))errors.push(`${solutionId}: vincule um recurso comercial presente na configuração.`);if(!Number.isFinite(Number(resolution?.quantity))||Number(resolution?.quantity)<1)errors.push(`${solutionId}: informe uma quantidade válida.`)}
 return{valid:errors.length===0,errors,pending};
}
