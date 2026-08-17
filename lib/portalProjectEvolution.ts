const list=(value:any)=>Array.isArray(value)?value:[];
const text=(value:any)=>typeof value==='string'&&value.trim()?value.trim():null;

function canonicalResourceIds(item:any){
 const snapshot=item?.origin_snapshot||{};
 const recommended=snapshot?.recommended||snapshot?.recommended_snapshot||item?.recommended_snapshot||{};
 return [...new Set([snapshot.recurso_id,snapshot.resource_id,snapshot.canonical_resource_id,snapshot.canonical_solution_id,recommended.recurso_id,recommended.resource_id,recommended.canonical_resource_id,recommended.canonical_solution_id].map(value=>text(value)).filter(Boolean))] as string[];
}

function canonicalInterventionCodes(item:any){const snapshot=item?.origin_snapshot||{},recommended=snapshot?.recommended||snapshot?.recommended_snapshot||item?.recommended_snapshot||{};return [...new Set([item?.source_action_code,snapshot?.intervention_code,recommended?.intervention_code,...list(snapshot?.intervention_codes),...list(recommended?.intervention_codes)].map(value=>text(value)).filter(Boolean))] as string[]}

export function portalProjectEvolutionProjection(input:{project:any;commercialSnapshot?:any;currentSituation?:any;officialPlan?:any;officialImplementation?:any;officialItems?:any[]}){
 const project=input.project?{...input.project}:null;
 if(!project)return{project:null,financial:{current_monthly:null,additional_monthly:null,new_monthly_total:null}};
 const official=Boolean(input.officialPlan&&input.officialImplementation&&String(input.officialImplementation.plan_id)===String(input.officialPlan.id)&&Number(input.officialImplementation.plan_version)===Number(input.officialPlan.version_number));
 const items=official?list(input.officialItems).filter(item=>String(item.implementation_id)===String(input.officialImplementation.id)):[];
 const byResource=new Map<string,string>();
 const byIntervention=new Map<string,Set<string>>();
 for(const item of items){const responsible=text(item.operational_responsible)||text(item.agreed_responsible);if(responsible){for(const id of canonicalResourceIds(item))byResource.set(id,responsible);for(const code of canonicalInterventionCodes(item)){const values=byIntervention.get(code)||new Set<string>();values.add(responsible);byIntervention.set(code,values)}}}
 const responsibleSet=[...new Set(items.map(item=>text(item.operational_responsible)||text(item.agreed_responsible)).filter(Boolean))] as string[];
 const commonOfficialExecutor=responsibleSet.length===1?responsibleSet[0]:null;
 project.projeto_evolucao_recursos=list(project.projeto_evolucao_recursos).map((resource:any)=>{const canonicalId=text(resource?.recurso_id),interventionExecutors=[...new Set(list(resource?.parametros_snapshot?.source_interventions).flatMap((code:any)=>[...(byIntervention.get(String(code))||[])]))],officialExecutor=(canonicalId?byResource.get(canonicalId):null)||(interventionExecutors.length===1?interventionExecutors[0]:null)||commonOfficialExecutor;return{...resource,executor:officialExecutor||(official?null:resource?.executor||null),executor_source:officialExecutor?'IMPLANTACAO_OFICIAL':official?'SEM_VINCULO_CANONICO':'LEGADO'}});
 const currentMonthly=input.currentSituation?.vigente===true&&input.currentSituation?.mensalidade!=null?Number(input.currentSituation.mensalidade):null;
 const frozenTotal=input.commercialSnapshot?.financial?.valor_mensalidade!=null?Number(input.commercialSnapshot.financial.valor_mensalidade):Number(project.nova_mensalidade||0);
 const monthlyIncrease=currentMonthly==null?null:frozenTotal-currentMonthly;
 project.mensalidade_atual=currentMonthly;project.nova_mensalidade=frozenTotal;project.acrescimo_mensal_exibicao=monthlyIncrease;
 return{project,financial:{current_monthly:currentMonthly,monthly_increase:monthlyIncrease,new_monthly_total:frozenTotal,current_source:'SITUACAO_COMERCIAL_VIGENTE',increase_source:'CALCULO_DE_EXIBICAO',total_source:input.commercialSnapshot?.financial?'CONSOLIDACAO_COMERCIAL_3_0':'PROJETO_PUBLICADO'},official_execution:{available:official,plan_id:input.officialPlan?.id||null,plan_version:input.officialPlan?.version_number||null,implementation_id:input.officialImplementation?.id||null}};
}
