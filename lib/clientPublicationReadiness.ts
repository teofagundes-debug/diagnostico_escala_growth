export const strategicContext=(project:any)=>project?.checklist?.strategic_context||null;

export function projectMatchesPublishedPlan(project:any,plan:any){
 const context=strategicContext(project);
 return Boolean(context&&plan&&String(context.plan_id)===String(plan.id)&&Number(context.plan_version)===Number(plan.version_number));
}

export function selectPublicationProject(projects:any[],plan:any){
 const drafts=(Array.isArray(projects)?projects:[]).filter(project=>project?.status==='Rascunho');
 if(plan)return drafts.find(project=>projectMatchesPublishedPlan(project,plan))||null;
 return drafts.find(project=>!strategicContext(project))||null;
}

export function officialImplementationReadiness(implementation:any,items:any[]){
 const rows=Array.isArray(items)?items:[];
 const missingResponsible=rows.filter(item=>!String(item?.operational_responsible||'').trim());
 const missingDue=rows.filter(item=>item?.agreed_horizon!=='QUANDO_ESTIVER_PRONTO'&&!String(item?.operational_due_date||'').trim());
 return{ready:Boolean(implementation&&rows.length&&missingResponsible.length===0&&missingDue.length===0),hasItems:rows.length>0,missingResponsible,missingDue};
}

export function commercialConsolidationReadiness(project:any,financial:any,fingerprintMatches:boolean){
 const snapshot=project?.commercial_3_0_snapshot,projectResources=project?.projeto_evolucao_recursos||[],snapshotResources=snapshot?.resources||[];
 const statusReady=project?.commercial_3_0_status==='PRONTO',hasSnapshot=Boolean(snapshot?.financial),implantation=Number(project?.valor_implantacao_adicional||0)===Number(snapshot?.financial?.valor_implantacao||0)&&Number(financial?.valor_implantacao||0)===Number(snapshot?.financial?.valor_implantacao||0),monthly=Number(project?.nova_mensalidade||0)===Number(snapshot?.financial?.valor_mensalidade||0)&&Number(financial?.valor_mensalidade||0)===Number(snapshot?.financial?.valor_mensalidade||0),resources=projectResources.length===snapshotResources.length;
 return{ready:Boolean(statusReady&&hasSnapshot&&fingerprintMatches&&implantation&&monthly&&resources),statusReady,hasSnapshot,fingerprintMatches,implantation,monthly,resources};
}

export function legacyPublicationReadiness(project:any){
 const checklist=project?.checklist||{};
 return{configuration:checklist.configuracoes_implantacao_concluidas===true,executor:checklist.executor_definido===true,financial:checklist.resumo_financeiro_atualizado===true};
}
