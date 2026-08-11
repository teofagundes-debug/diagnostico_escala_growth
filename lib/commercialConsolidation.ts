export const isStrategicCommercialProject=(project:any)=>Boolean(
 project?.checklist?.strategic_context?.flow==='ESTRATEGICO_3_0'||
 (project?.projeto_evolucao_recursos||[]).some((item:any)=>item?.parametros_snapshot?.flow==='ESTRATEGICO_3_0')
);

const normalized=(value:any):any=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalized(value[key])])):value;
export const commercialSource=(project:any)=>({
 project:{id:project.id,updated_at:project.updated_at,valor_implantacao_adicional:Number(project.valor_implantacao_adicional||0),implantacao_modalidade:project.implantacao_modalidade||null,nova_mensalidade:Number(project.nova_mensalidade||0),desconto_recorrente:Number(project.desconto_recorrente||0),forma_cobranca:project.forma_cobranca||null,formalizacao:project.formalizacao||null},
 resources:(project.projeto_evolucao_recursos||[]).map((item:any)=>({id:item.id,recurso_id:item.recurso_id,nome_snapshot:item.nome_snapshot,tipo_snapshot:item.tipo_snapshot,movimento:item.movimento,valor_implantacao:Number(item.valor_implantacao||0),valor_mensal:Number(item.valor_mensal||0),parametros_snapshot:item.parametros_snapshot||{}})).sort((a:any,b:any)=>String(a.recurso_id).localeCompare(String(b.recurso_id)))
});
export async function commercialFingerprint(project:any){const bytes=new TextEncoder().encode(JSON.stringify(normalized(commercialSource(project)))),hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(value=>value.toString(16).padStart(2,'0')).join('')}

export const canonicalResource=(item:any)=>{const snapshot=item.parametros_snapshot||{};return{
 recurso_id:item.recurso_id,code:snapshot.solution_code||null,nome:item.nome_snapshot,tipo:item.tipo_snapshot,
 ui:Number(snapshot.ui_utilizada||0),valor_ui:Number(snapshot.valor_ui_utilizado||0),implantacao:Number((item.valor_implantacao??snapshot.valor_implantacao_calculado)||0),mensalidade:Number((item.valor_mensal??snapshot.valor_mensal_utilizado)||0),
 origem:snapshot.flow||snapshot.origem||item.origem||null,source_interventions:snapshot.source_interventions||[],parent_solution_ids:snapshot.parent_solution_ids||[],dependency_source:snapshot.dependency_source||[],parametros_snapshot:snapshot
}}
