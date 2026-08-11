import {isMaster} from '../../../lib/access';
import {composeGrowthProject,solutionParameters} from '../../../lib/motor-growth';
import {pendingDefinitions} from '../../../lib/intelligent-pendencies';
import {commercialFingerprint} from '../../../lib/commercialConsolidation';

const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({'Content-Type':'application/json',apikey:KEY!,Authorization:`Bearer ${KEY}`});
const array=(value:any)=>Array.isArray(value)?value:[];
const amount=(value:unknown)=>Math.max(0,Number(value)||0);
const strategicDraft=(project:any)=>project?.status==='Rascunho'&&(project?.checklist?.strategic_context?.flow==='ESTRATEGICO_3_0'||(Boolean(project?.checklist?.strategic_context?.diagnostic_id&&project?.checklist?.strategic_context?.plan_id)&&array(project?.projeto_evolucao_recursos).some((item:any)=>item?.parametros_snapshot?.flow==='ESTRATEGICO_3_0')));
const executorOptions=['Escala Vendas','Parceiro do Cliente','Equipe Interna do Cliente','Não executar neste momento'];
const executionChecklist=(resources:any[],current:any={})=>{const recommended=array(resources).filter((item:any)=>item.recomendado_metodo||['Recomendado','Opcional'].includes(item.classificacao)),marketing=recommended.filter((item:any)=>pendingDefinitions([item]).some(rule=>rule.codigo==='MARKETING_PARAMETROS')),phaseDefined=recommended.length>0&&recommended.every((item:any)=>typeof item.implantar_nesta_fase==='boolean'),implemented=recommended.filter((item:any)=>item.implantar_nesta_fase===true),executorDefined=phaseDefined&&implemented.every((item:any)=>['Escala Vendas','Parceiro do Cliente','Equipe Interna do Cliente'].includes(item.executor)),needsMarketingParameters=marketing.some((item:any)=>item.implantar_nesta_fase===true&&item.executor==='Escala Vendas'),investmentDefined=marketing.every((item:any)=>item.implantar_nesta_fase===false||item.investimento_aprovado!==null&&item.investimento_aprovado!==undefined&&item.investimento_aprovado!=='');return{...current,escopo_validado:true,configuracoes_implantacao_concluidas:phaseDefined&&executorDefined,estrategia_marketing_definida:marketing.length===0||marketing.every((item:any)=>typeof item.implantar_nesta_fase==='boolean'),executor_definido:executorDefined,investimento_aprovado_registrado:investmentDefined,resumo_financeiro_atualizado:phaseDefined&&executorDefined,marketing_parametros:needsMarketingParameters?current.marketing_parametros===true:true}};

async function db(path:string,init?:RequestInit){
 const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init?.headers||{})},cache:'no-store'});
 if(!response.ok)throw new Error(await response.text());
 const text=await response.text();return text?JSON.parse(text):[];
}
async function identity(req:Request){
 if(await isMaster(req))return{role:'master',empresa_id:null};
 const token=req.headers.get('cookie')?.match(/escala_session=([^;]+)/)?.[1];
 if(!token||!SUPABASE_URL||!process.env.SUPABASE_ANON_KEY)return null;
 const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:process.env.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`}});
 if(!response.ok)return null;
 const user=await response.json(),rows=await db(`portal_usuarios?auth_user_id=eq.${encodeURIComponent(user.id)}&select=empresa_id&limit=1`);
 return rows[0]?{role:'cliente',empresa_id:rows[0].empresa_id}:null;
}
async function context(empresaId:string){
 const id=encodeURIComponent(empresaId),[rawVersions,rawProjects,rawPendencies,rawExecutionHistory,rawCatalog,rawFinancials,rawDiagnostics,rawMeetings,rawPlans]=await Promise.all([
  db(`situacoes_comerciais_versoes?empresa_id=eq.${id}&select=*&order=versao.desc`),
  db(`projetos_evolucao?empresa_id=eq.${id}&select=*,projeto_evolucao_recursos(*),pendencias_inteligentes(*)&order=created_at.desc`),
  db(`pendencias_inteligentes?empresa_id=eq.${id}&select=*&order=created_at`),
  db(`estrategia_execucao_historico?empresa_id=eq.${id}&select=*&order=created_at.desc`).catch(()=>[]),
  db('catalogo_recursos?ativo=eq.true&select=*&order=categoria,nome'),
  db(`financeiro_growth?empresa_id=eq.${id}&select=valor_mensalidade,status&limit=1`),
  db(`diagnosticos?empresa_id=eq.${id}&select=id,menor_pilar,relatorio_snapshot&order=created_at.desc&limit=1`),
  db(`reunioes_estrategicas?empresa_id=eq.${id}&select=dados_reuniao&order=created_at.desc&limit=1`),
  db(`planos_estrategicos?empresa_id=eq.${id}&select=objetivos,prioridades,proximos_passos&order=created_at.desc&limit=1`)
 ]),versions=array(rawVersions),pendencies=array(rawPendencies),projects=array(rawProjects).map((project:any)=>{const projectPendencies=pendencies.filter((item:any)=>item.projeto_evolucao_id===project.id),marketingConfigured=projectPendencies.some((item:any)=>item.codigo==='MARKETING_PARAMETROS'&&item.status==='Concluída');return{...project,checklist:{...(project.checklist||{}),marketing_parametros:marketingConfigured||project.checklist?.marketing_parametros===true},pendencias_inteligentes:projectPendencies}}),catalog=array(rawCatalog),financials=array(rawFinancials),current=versions.find((row:any)=>row.vigente)||null,diagnostic=array(rawDiagnostics)[0]||{},meeting=array(rawMeetings)[0]||{},plan=array(rawPlans)[0]||{},meetingData=meeting.dados_reuniao||{},activeNames=array(current?.recursos).map((item:any)=>item.nome_snapshot||item.nome).filter(Boolean),relationship=meetingData.tipo_relacionamento,baseClient=relationship==='Cliente da Base',priority=plan.objetivos||plan.prioridades||diagnostic.menor_pilar||'Organizar',platform=meetingData.situacao_plataforma||{},motor=projects.some(strategicDraft)?null:composeGrowthProject({catalog,activeResources:activeNames,priority,baseClient,signals:{possui_marketing:Boolean(platform['Google Ads']||platform['Meta Ads']),possui_agencia:Boolean(meetingData.possui_agencia),realiza_campanhas:Boolean(platform['Campanhas WhatsApp']||platform['Google Ads']||platform['Meta Ads'])}});
 return{current,history:versions,projects,executionHistory:array(rawExecutionHistory),catalog,motor,plan,suggestion:{mensalidade:Number(financials[0]?.valor_mensalidade||0),status:financials[0]?.status||null,requiresConfirmation:versions.length===0}};
}
const projectPayload=(body:any,current:any)=>{const additional=amount(body.mensalidade_adicional),implantation=amount(body.valor_implantacao_adicional),charge=body.forma_cobranca||'Sem cobrança imediata',noCharge=['Cobrança recorrente existente','Sem cobrança imediata'].includes(charge);return{
 empresa_id:String(body.empresa_id),nome:String(body.nome||'Novo Projeto de Evolução'),tipo:body.tipo||'Inclusão de novo recurso',descricao:body.descricao||null,objetivo:body.objetivo||null,
 mensalidade_atual:amount(current?.mensalidade),mensalidade_adicional:additional,desconto_recorrente:amount(body.desconto_recorrente),valor_implantacao_adicional:implantation,
 implantacao_modalidade:body.implantacao_modalidade||'Sem cobrança',motivo_implantacao:body.motivo_implantacao||null,data_inicio:body.data_inicio||null,observacoes_internas:body.observacoes_internas||null,
 exige_contrato:Boolean(body.exige_contrato),exige_aditivo:Boolean(body.exige_aditivo),exige_aceite:body.exige_aceite!==false,exige_pagamento:Boolean(body.exige_pagamento)&&!noCharge&&(implantation>0||additional>0),
 forma_cobranca:charge,forma_pagamento_implantacao:body.forma_pagamento_implantacao||null,forma_pagamento_mensal:body.forma_pagamento_mensal||null,
 formalizacao:body.formalizacao||'Termo de adesão ao Método Escala Growth',checklist:body.checklist||{},criado_por:body.criado_por||'Usuário Master'
}};
const parametersSnapshot=(item:any)=>item.parametros_snapshot&&Object.keys(item.parametros_snapshot).length?item.parametros_snapshot:(item.parametros_metodo||solutionParameters(item));
const canonicalResourceId=(item:any,allowLegacyFallback=true)=>String(item?.recurso_id||(allowLegacyFallback?item?.id:'')||'').trim();
const resourceLabel=(item:any)=>String(item?.nome_snapshot||item?.nome||'Solução não identificada');
class InvalidCatalogResourceError extends Error{
 code='INVALID_CATALOG_RESOURCE';
 details:any;
 constructor(details:any){super('Existe um recurso sem vínculo válido com a Biblioteca. Atualize a página e revise o Projeto de Evolução antes de salvar novamente.');this.name='InvalidCatalogResourceError';this.details=details}
}
async function validateCatalogResources(project:any,resources:any[],origin:string){
 const allowLegacyFallback=!strategicDraft(project),references=resources.map((item:any)=>[canonicalResourceId(item,allowLegacyFallback),item] as [string,any]),missing=references.find(([id])=>!id);
 if(missing)throw new InvalidCatalogResourceError({recurso_id:null,project_resource_id:missing[1]?.id||null,origem:origin,projeto_id:project.id,solucao:resourceLabel(missing[1]),flow:allowLegacyFallback?'LEGACY':'ESTRATEGICO_3_0'});
 const referenced=[...new Map(references).entries()];
 if(!referenced.length)return;
 const ids=referenced.map(([id])=>id),catalog=array(await db(`catalogo_recursos?id=in.(${ids.map(id=>encodeURIComponent(id)).join(',')})&select=id,codigo,nome`)),valid=new Set(catalog.map((item:any)=>String(item.id)));
 const invalid=referenced.find(([id])=>!valid.has(id));
 if(invalid){
  const [recursoId,item]=invalid;
  throw new InvalidCatalogResourceError({recurso_id:recursoId,origem:origin,projeto_id:project.id,solucao:resourceLabel(item)});
 }
 const catalogById=new Map(catalog.map((item:any)=>[String(item.id),item]));
 console.info('[commercial-evolution][SAVE_VALIDATE_RESOURCES] recursos canônicos validados',{project_id:project.id,flow:allowLegacyFallback?'LEGACY':'ESTRATEGICO_3_0',resources:references.map(([recursoId,item])=>({project_resource_id:item?.id||null,recurso_id:recursoId,catalog_id:catalogById.get(recursoId)?.id||null,codigo:catalogById.get(recursoId)?.codigo||null,nome:catalogById.get(recursoId)?.nome||resourceLabel(item)}))});
}
async function replaceResources(projectId:string,resources:any[],allowLegacyFallback=true){
 await db(`projeto_evolucao_recursos?projeto_evolucao_id=eq.${encodeURIComponent(projectId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
 if(!resources.length)return;
 await db('projeto_evolucao_recursos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(resources.map((item:any)=>{const snapshot=parametersSnapshot(item),financial=snapshot.impacta_financeiro!==false;return{projeto_evolucao_id:projectId,recurso_id:canonicalResourceId(item,allowLegacyFallback),nome_snapshot:item.nome||item.nome_snapshot,tipo_snapshot:item.tipo||item.tipo_snapshot||'Implantação',movimento:item.movimento||'Adicionar',valor_implantacao:financial?amount(item.valor_implantacao??snapshot.valor_implantacao_padrao):0,valor_mensal:financial?amount(item.valor_mensal??snapshot.valor_mensalidade_padrao):0,classificacao:item.classificacao||'Recomendado',origem:item.origem||'Consultor',peso:item.peso||null,fase:item.fase||'Recomendações Estratégicas',recomendado_metodo:Boolean(item.recomendado_metodo||['Recomendado','Opcional'].includes(item.classificacao)),implantar_nesta_fase:typeof item.implantar_nesta_fase==='boolean'?item.implantar_nesta_fase:null,contratado:item.implantar_nesta_fase===true&&item.executor==='Escala Vendas',executor:item.implantar_nesta_fase===true&&executorOptions.includes(item.executor)?item.executor:null,executor_dados:item.executor_dados||{},investimento_recomendado:item.investimento_recomendado==null?amount(item.investimento_minimo_recomendado??snapshot.investimento_minimo_recomendado):amount(item.investimento_recomendado),investimento_aprovado:item.investimento_aprovado===''||item.investimento_aprovado==null?null:amount(item.investimento_aprovado),motivo_investimento:item.motivo_investimento||null,parametros_snapshot:snapshot,decisao_em:typeof item.implantar_nesta_fase==='boolean'?new Date().toISOString():null,decisao_por:typeof item.implantar_nesta_fase==='boolean'?(item.decisao_por||'Usuário Master'):null}}))});
}
async function persistStrategicExecutionResources(project:any,resources:any[]){
 const current=array(await db(`projeto_evolucao_recursos?projeto_evolucao_id=eq.${encodeURIComponent(project.id)}&select=id,recurso_id`)),snapshotResources=array(project.commercial_3_0_snapshot?.resources),now=new Date().toISOString();
 for(const item of resources){
  const resourceId=canonicalResourceId(item,false),row=current.find((entry:any)=>String(entry.recurso_id)===resourceId),frozen=snapshotResources.find((entry:any)=>String(entry.recurso_id)===resourceId);
  if(!row||!frozen)throw new InvalidCatalogResourceError({recurso_id:resourceId,origem:'commercial_3_0_snapshot.resources',projeto_id:project.id,solucao:resourceLabel(item)});
  const phase=typeof item.implantar_nesta_fase==='boolean'?item.implantar_nesta_fase:null,executor=phase===true&&executorOptions.includes(item.executor)?item.executor:null;
  await db(`projeto_evolucao_recursos?id=eq.${encodeURIComponent(row.id)}&projeto_evolucao_id=eq.${encodeURIComponent(project.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({implantar_nesta_fase:phase,contratado:phase===true&&executor==='Escala Vendas',executor,executor_dados:item.executor_dados||{},investimento_recomendado:item.investimento_recomendado==null?null:amount(item.investimento_recomendado),investimento_aprovado:item.investimento_aprovado===''||item.investimento_aprovado==null?null:amount(item.investimento_aprovado),motivo_investimento:item.motivo_investimento||null,decisao_em:phase!==null?now:null,decisao_por:phase!==null?(item.decisao_por||'Usuário Master'):null,valor_implantacao:amount(frozen.implantacao),valor_mensal:amount(frozen.mensalidade)})});
 }
}
async function syncPendencies(project:any,resources:any[]){
 const operationalStarted=['Kickoff realizado','Implantação concluída','Cliente Ativo'].includes(project.status),definitions=pendingDefinitions(resources.filter((item:any)=>item.implantar_nesta_fase===true&&item.executor==='Escala Vendas')).filter(item=>item.codigo!=='MARKETING_PARAMETROS'||operationalStarted),activeCodes=definitions.map(item=>item.codigo),now=new Date().toISOString(),existing=array(await db(`pendencias_inteligentes?projeto_evolucao_id=eq.${encodeURIComponent(project.id)}&select=id,codigo,status`));
 for(const item of definitions){const current=existing.find((row:any)=>row.codigo===item.codigo);await db('pendencias_inteligentes?on_conflict=projeto_evolucao_id,codigo',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({empresa_id:project.empresa_id,projeto_evolucao_id:project.id,codigo:item.codigo,titulo:item.titulo,categoria:item.categoria,rota_configuracao:item.rota||null,solucoes_origem:item.solutions,status:current?.status==='Concluída'?'Concluída':'Pendente',updated_at:now})})}
 for(const item of existing.filter((row:any)=>!activeCodes.includes(row.codigo)))await db(`pendencias_inteligentes?id=eq.${encodeURIComponent(item.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Dispensada',updated_at:now})});
}
async function recordExecutionHistory(project:any,resources:any[],usuario='Usuário Master',resourcesAlreadyValidated=false){
 if(!resourcesAlreadyValidated)await validateCatalogResources(project,resources,'projeto_evolucao_recursos.recurso_id');
 const allowLegacyFallback=!strategicDraft(project),previous=array(await db(`projeto_evolucao_recursos?projeto_evolucao_id=eq.${encodeURIComponent(project.id)}&select=recurso_id,nome_snapshot,executor,executor_dados`)),rows=resources.flatMap((item:any)=>{const recursoId=canonicalResourceId(item,allowLegacyFallback),current=previous.find((row:any)=>row.recurso_id===recursoId),nextExecutor=executorOptions.includes(item.executor)?item.executor:null,nextData=item.executor_dados||{};if(current&&current.executor===nextExecutor&&JSON.stringify(current.executor_dados||{})===JSON.stringify(nextData))return[];if(!nextExecutor&&!current?.executor)return[];return[{empresa_id:project.empresa_id,projeto_evolucao_id:project.id,recurso_id:recursoId||null,nome_snapshot:item.nome||item.nome_snapshot||'Solução recomendada',executor_anterior:current?.executor||null,executor_novo:nextExecutor,dados_anteriores:current?.executor_dados||{},dados_novos:nextData,alterado_por:usuario,motivo:item.motivo_alteracao_executor||'Definição da Estratégia de Execução'}]});
 if(rows.length)await db('estrategia_execucao_historico',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(rows)});
}

const normalize=(value:unknown)=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const marketingRecommendations=(result:any)=>{
 const planText=normalize(result.plan?.proximos_passos),motorResources=array(result.motor?.strategic),catalog=array(result.catalog);
 const planResources=catalog.filter((item:any)=>pendingDefinitions([item]).some(definition=>definition.codigo==='MARKETING_PARAMETROS')&&planText.includes(normalize(item.nome)));
 return [...new Map([...motorResources,...planResources].map((item:any)=>[item.id||normalize(item.nome),item])).values()];
};
async function reconcileMotorPendencies(empresaId:string,result:any){
 if(array(result.projects).some(strategicDraft))return result;
 const recommended=marketingRecommendations(result),marketing=pendingDefinitions(recommended).find(item=>item.codigo==='MARKETING_PARAMETROS');
 if(!marketing)return result;
 let project=array(result.projects).find((item:any)=>item.status==='Rascunho');
 if(!project){
  project=(await db('projetos_evolucao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...projectPayload({empresa_id:empresaId,nome:'Projeto de Evolução — Motor de Crescimento',tipo:'Inclusão de novo recurso',descricao:'Projeto preparado automaticamente a partir das recomendações estratégicas do Método Escala Growth.',objetivo:`Evoluir a prioridade ${result.motor?.objective||'definida no diagnóstico'}.`,checklist:{marketing_parametros:false},criado_por:'Usuário Master'},result.current),status:'Rascunho'})}))[0];
 }
 const existingResources=array(project.projeto_evolucao_recursos),existingIds=new Set(existingResources.map((item:any)=>String(item.recurso_id||item.id)));
 const missing=recommended.filter((item:any)=>item.id&&!existingIds.has(String(item.id)));
 for(const item of missing)await db('projeto_evolucao_recursos?on_conflict=projeto_evolucao_id,recurso_id,movimento',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({projeto_evolucao_id:project.id,recurso_id:item.id,nome_snapshot:item.nome,tipo_snapshot:item.tipo||'Implantação',movimento:'Adicionar',valor_implantacao:amount(item.valor_implantacao),valor_mensal:amount(item.valor_mensal),classificacao:'Recomendado',origem:item.origem||'Motor de Decisão',peso:Math.min(10,Math.max(1,Number(item.peso||1))),fase:'Recomendações Estratégicas',investimento_recomendado:amount(item.investimento_minimo_recomendado),parametros_snapshot:parametersSnapshot(item)})});
 const combined=[...existingResources,...recommended];
 await syncPendencies(project,combined);
 const now=new Date().toISOString(),completed=array(await db(`pendencias_inteligentes?projeto_evolucao_id=eq.${encodeURIComponent(project.id)}&codigo=eq.MARKETING_PARAMETROS&status=eq.Conclu%C3%ADda&select=id&limit=1`)).length>0;
 await db(`projetos_evolucao?id=eq.${encodeURIComponent(project.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({checklist:{...(project.checklist||{}),marketing_parametros:completed},responsavel_atualizacao:'Usuário Master',updated_at:now})});
 return context(empresaId);
}

export async function GET(req:Request){
 try{
  const actor=await identity(req);if(!actor)return Response.json({error:'Não autorizado.'},{status:403});
  const requested=new URL(req.url).searchParams.get('empresa_id'),empresaId=actor.role==='master'?requested:actor.empresa_id;
  if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  let result=await context(empresaId);
  if(actor.role==='cliente')return Response.json({current:result.current,projects:result.projects.filter((project:any)=>['Publicado','Aceito','Formalizado'].includes(project.status)).slice(0,1).map(({observacoes_internas,checklist,criado_por,responsavel_atualizacao,...safe}:any)=>safe)});
  result=await reconcileMotorPendencies(empresaId,result);
  return Response.json(result);
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível carregar o histórico comercial.'},{status:500})}
}

export async function POST(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const body=await req.json();
  if(body.action==='duplicate'){
   const source=(await db(`projetos_evolucao?id=eq.${encodeURIComponent(String(body.source_id||''))}&select=*,projeto_evolucao_recursos(*)&limit=1`))[0];
   if(!source)return Response.json({error:'Projeto não encontrado.'},{status:404});
   const current=(await context(source.empresa_id)).current,payload=projectPayload({...source,empresa_id:source.empresa_id,nome:`${source.nome} — Cópia`},current);
   const saved=(await db('projetos_evolucao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...payload,status:'Rascunho'})}))[0];
   await recordExecutionHistory(saved,array(source.projeto_evolucao_recursos),body.usuario||'Usuário Master');await replaceResources(saved.id,array(source.projeto_evolucao_recursos));await syncPendencies(saved,array(source.projeto_evolucao_recursos));return Response.json({ok:true,project:saved},{status:201});
  }
  const empresaId=String(body.empresa_id||'');if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  if(body.action==='prepare-strategic-draft'){
   const diagnosticId=String(body.diagnostic_id||''),planId=String(body.plan_id||''),planVersion=Number(body.plan_version);
   if(!diagnosticId||!planId||!Number.isFinite(planVersion))return Response.json({error:'Diagnóstico, Plano Estratégico e versão são obrigatórios para preparar o rascunho.'},{status:400});
   const currentContext=await context(empresaId),strategicContext={flow:'ESTRATEGICO_3_0',diagnostic_id:diagnosticId,plan_id:planId,plan_version:planVersion,strategic_direction:body.strategic_direction||null,primary_priority:body.primary_priority||null,commercial_snapshot:{valor_implantacao:amount(body.valor_implantacao_adicional),valor_mensal:amount(body.mensalidade_adicional),captured_at:new Date().toISOString()}};
   const existing=currentContext.projects.find((project:any)=>project.status==='Rascunho'&&project.checklist?.strategic_context?.diagnostic_id===diagnosticId&&project.checklist?.strategic_context?.plan_id===planId&&Number(project.checklist?.strategic_context?.plan_version)===planVersion);
   const resources=array(body.recursos),checklist=executionChecklist(resources,{...(existing?.checklist||{}),strategic_context:strategicContext});
   const payload=projectPayload({...body,empresa_id:empresaId,checklist},currentContext.current);
   let saved:any,created=false;
   if(existing){
     await db(`projetos_evolucao?id=eq.${encodeURIComponent(existing.id)}&empresa_id=eq.${encodeURIComponent(empresaId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({...payload,status:'Rascunho',commercial_3_0_status:existing.commercial_3_0_snapshot?'DESATUALIZADO':existing.commercial_3_0_status,updated_at:new Date().toISOString(),responsavel_atualizacao:body.usuario||'Usuário Master'})});
    saved={...existing,...payload,status:'Rascunho'};
   }else{
    saved=(await db('projetos_evolucao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...payload,status:'Rascunho'})}))[0];created=true;
   }
   await replaceResources(saved.id,resources);await syncPendencies(saved,resources);
   const project=(await db(`projetos_evolucao?id=eq.${encodeURIComponent(saved.id)}&empresa_id=eq.${encodeURIComponent(empresaId)}&select=*,projeto_evolucao_recursos(*)&limit=1`))[0];
   if(!project)return Response.json({error:'O rascunho foi preparado, mas não pôde ser recarregado com segurança.'},{status:500});
   return Response.json({ok:true,created,project,projeto_evolucao_id:project.id,empresa_id:empresaId,diagnostic_id:diagnosticId,plan_id:planId,plan_version:planVersion,status:project.status,updated_at:project.updated_at,message:'Composição aplicada ao rascunho com sucesso.'},{status:created?201:200});
  }
  const currentContext=await context(empresaId),duplicate=currentContext.projects.find((project:any)=>project.status==='Rascunho'&&project.tipo===body.tipo);
  if(duplicate&&!body.allow_duplicate)return Response.json({error:'Já existe um Projeto de Evolução deste tipo em andamento.',code:'DUPLICATE_DRAFT',project:duplicate},{status:409});
  const resources=array(body.recursos),saved=(await db('projetos_evolucao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...projectPayload({...body,checklist:executionChecklist(resources,body.checklist)},currentContext.current),status:'Rascunho'})}))[0];
  await recordExecutionHistory(saved,resources,body.usuario||'Usuário Master');await replaceResources(saved.id,resources);await syncPendencies(saved,resources);return Response.json({ok:true,project:saved},{status:201});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível criar o Projeto de Evolução.'},{status:500})}
}

export async function PATCH(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const body=await req.json(),id=String(body.id||''),now=new Date().toISOString();if(!id)return Response.json({error:'Projeto não informado.'},{status:400});
  const existing=(await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}&select=*&limit=1`))[0];if(!existing)return Response.json({error:'Projeto não encontrado.'},{status:404});
  if(body.action==='execution-strategy'){
   if(existing.status!=='Rascunho')return Response.json({error:'A Estratégia de Execução somente pode ser alterada em projetos em Rascunho.'},{status:409});
   const resources=array(body.recursos),strategic=strategicDraft(existing),canonicalFinancial=strategic?existing.commercial_3_0_snapshot?.financial:null,checklistBase=executionChecklist(resources,existing.checklist),canonicalFinancialValid=Boolean(canonicalFinancial&&amount(canonicalFinancial.valor_implantacao)>=0&&amount(canonicalFinancial.valor_mensalidade)>=0),checklist={...checklistBase,resumo_financeiro_atualizado:strategic?canonicalFinancialValid:checklistBase.resumo_financeiro_atualizado};
   if(strategic&&!canonicalFinancialValid)return Response.json({error:'A Consolidação Comercial 3.0 não possui um resumo financeiro válido. Revise a consolidação antes de salvar as Configurações da Implantação.',code:'COMMERCIAL_3_0_FINANCIAL_MISSING'},{status:409});
   let saveStage='SAVE_IMPLEMENTATION_CONFIG';
   try{
    saveStage='SAVE_VALIDATE_RESOURCES';await validateCatalogResources(existing,resources,'projeto_evolucao_recursos.recurso_id');
    saveStage='SAVE_EXECUTION_HISTORY';await recordExecutionHistory(existing,resources,body.usuario||'Usuário Master',true);
    saveStage='SAVE_EXECUTION_STRATEGY';if(strategic)await persistStrategicExecutionResources(existing,resources);else await replaceResources(id,resources,true);
    saveStage='SAVE_INTELLIGENT_PENDENCIES';await syncPendencies(existing,resources);
    const contracted=resources.filter((item:any)=>item.movimento==='Adicionar'&&item.implantar_nesta_fase===true&&item.executor==='Escala Vendas'),monthly=contracted.reduce((sum:number,item:any)=>sum+amount(item.valor_mensal),0),implantation=contracted.reduce((sum:number,item:any)=>sum+amount(item.valor_implantacao),0),newMonthly=Math.max(0,amount(existing.mensalidade_atual)+monthly-amount(existing.desconto_recorrente));
    if(strategic){
     const frozenImplantation=amount(canonicalFinancial.valor_implantacao),frozenMonthly=amount(canonicalFinancial.valor_mensalidade),additionalMonthly=Math.max(0,frozenMonthly-amount(existing.mensalidade_atual)+amount(existing.desconto_recorrente));
     saveStage='SAVE_CHECKLIST';await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({checklist,mensalidade_adicional:additionalMonthly,valor_implantacao_adicional:frozenImplantation,commercial_3_0_status:'PRONTO',updated_at:now,responsavel_atualizacao:body.usuario||'Usuário Master'})});
     saveStage='SAVE_CANONICAL_FINANCIAL';await db('financeiro_growth?on_conflict=empresa_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({empresa_id:existing.empresa_id,valor_implantacao:frozenImplantation,valor_mensalidade:frozenMonthly,prazo_contratual:canonicalFinancial.prazo_contratual,validade_proposta:canonicalFinancial.validade_proposta,desconto_pix:canonicalFinancial.desconto_pix,updated_at:now})});
     const refreshed=(await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}&select=*,projeto_evolucao_recursos(*)&limit=1`))[0],fingerprint=await commercialFingerprint(refreshed);
     await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({commercial_3_0_status:'PRONTO',commercial_3_0_fingerprint:fingerprint})});
     return Response.json({ok:true,flow:'ESTRATEGICO_3_0',checklist,mensalidade_adicional:additionalMonthly,valor_implantacao_adicional:frozenImplantation,nova_mensalidade:frozenMonthly,resources_count:array(existing.commercial_3_0_snapshot?.resources).length,financial_source:'CONSOLIDACAO_COMERCIAL_3_0'});
    }
    saveStage='SAVE_CHECKLIST';await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({checklist,mensalidade_adicional:monthly,valor_implantacao_adicional:implantation,updated_at:now,responsavel_atualizacao:body.usuario||'Usuário Master'})});
    return Response.json({ok:true,flow:'LEGACY',checklist,mensalidade_adicional:monthly,valor_implantacao_adicional:implantation,nova_mensalidade:newMonthly,financial_source:'EXECUTION_CONFIGURATION'});
   }catch(error:any){
    const technical=error instanceof InvalidCatalogResourceError?error.details:{message:error?.message||String(error)};
    console.error(`[commercial-evolution][${saveStage}] falha ao salvar Configurações da Implantação`,{project_id:id,empresa_id:existing.empresa_id,flow:strategicDraft(existing)?'ESTRATEGICO_3_0':'LEGACY',technical});
    return Response.json({error:error instanceof InvalidCatalogResourceError?error.message:'Não foi possível salvar as Configurações da Implantação. Tente novamente; se o problema persistir, contate o administrador.',code:error?.code||'IMPLEMENTATION_CONFIG_SAVE_FAILED',stage:saveStage},{status:error instanceof InvalidCatalogResourceError?422:500});
   }
  }
  if(body.action==='update'){
   if(existing.status!=='Rascunho')return Response.json({error:'Somente Projetos em Rascunho podem ser editados.'},{status:409});
   const resources=array(body.recursos),current=(await context(existing.empresa_id)).current,payload=projectPayload({...body,empresa_id:existing.empresa_id,checklist:executionChecklist(resources,existing.checklist)},current);
   await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({...payload,commercial_3_0_status:existing.commercial_3_0_snapshot?'DESATUALIZADO':existing.commercial_3_0_status,updated_at:now,responsavel_atualizacao:body.responsavel_atualizacao||'Usuário Master'})});
   await recordExecutionHistory(existing,resources,body.usuario||'Usuário Master');await replaceResources(id,resources);await syncPendencies(existing,resources);return Response.json({ok:true});
  }
  if(body.action==='publish'){
   return Response.json({error:'A publicação oficial deve ser realizada em Publicação e Acesso, para manter Projeto, Contrato, versão e convite sincronizados.'},{status:409});
  }
  if(body.action==='cancel-publication'){
   if(existing.status!=='Publicado')return Response.json({error:'Somente Projetos Publicados podem ter a publicação cancelada.'},{status:409});
   await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Rascunho',publicado_em:null,updated_at:now})});return Response.json({ok:true});
  }
  if(body.action==='complete-checklist'){
   if(existing.status!=='Aceito')return Response.json({error:'O checklist somente pode ser concluído após o aceite.'},{status:409});
   await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({checklist:{...(existing.checklist||{}),checklist_concluido:true},updated_at:now})});return Response.json({ok:true});
  }
  if(body.action==='formalize'){
   const checklist=existing.checklist||{},ready=existing.status==='Aceito'&&checklist.contrato_aceito===true&&checklist.documentacao_formalizada===true&&checklist.checklist_concluido===true;
   if(!ready)return Response.json({error:'A promoção exige contrato aceito, documentação formalizada e checklist concluído.'},{status:409});
   if(existing.exige_pagamento){const financial=(await db(`financeiro_growth?empresa_id=eq.${encodeURIComponent(existing.empresa_id)}&select=status&limit=1`))[0];if(financial?.status!=='Pagamento confirmado')return Response.json({error:'Confirme o pagamento antes da formalização deste projeto.'},{status:409});}
   const rawProjectResources=await db(`projeto_evolucao_recursos?projeto_evolucao_id=eq.${encodeURIComponent(id)}&select=*`),projectResources=array(rawProjectResources),versions=array(await db(`situacoes_comerciais_versoes?empresa_id=eq.${encodeURIComponent(existing.empresa_id)}&select=versao&order=versao.desc&limit=1`)),start=existing.data_inicio||now.slice(0,10),renewal=new Date(`${start}T12:00:00Z`),previous=(await context(existing.empresa_id)).current,previousResources=array(previous?.recursos),removed=new Set(projectResources.filter((x:any)=>x.movimento==='Remover').map((x:any)=>x.recurso_id)),active=[...previousResources.filter((x:any)=>!removed.has(x.recurso_id)),...projectResources.filter((x:any)=>x.movimento==='Adicionar')];
   renewal.setUTCFullYear(renewal.getUTCFullYear()+1);await db(`situacoes_comerciais_versoes?empresa_id=eq.${encodeURIComponent(existing.empresa_id)}&vigente=eq.true`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({vigente:false})});
   await db('situacoes_comerciais_versoes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:existing.empresa_id,projeto_evolucao_id:id,versao:Number(versions[0]?.versao||0)+1,vigente:true,mensalidade:existing.nova_mensalidade,forma_pagamento:existing.forma_cobranca,status_pagamento:'Ativo',contrato_status:'Ativo',contrato_inicio:start,prazo_meses:12,renovacao_em:renewal.toISOString().slice(0,10),recursos:active,snapshot:{project:existing,resources:projectResources}})});
   await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Formalizado',formalizado_em:now,updated_at:now})});return Response.json({ok:true});
  }
  return Response.json({error:'Ação não reconhecida.'},{status:400});
 }catch(error:any){
  if(error instanceof InvalidCatalogResourceError){console.error('[commercial-evolution] recurso canônico inválido',error.details);return Response.json({error:error.message,code:error.code},{status:422})}
  console.error('[commercial-evolution] falha ao atualizar Projeto de Evolução',error);
  return Response.json({error:'Não foi possível salvar as Configurações da Implantação. Tente novamente; se o problema persistir, contate o administrador.'},{status:500})
 }
}

export async function DELETE(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const id=new URL(req.url).searchParams.get('id');if(!id)return Response.json({error:'Projeto não informado.'},{status:400});
  const existing=(await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}&select=id,status&limit=1`))[0];if(!existing)return Response.json({error:'Projeto não encontrado.'},{status:404});
  if(existing.status!=='Rascunho')return Response.json({error:'Somente Projetos em Rascunho podem ser excluídos.'},{status:409});
  const linked=await Promise.all(['contratos_growth','aceites_growth','pagamentos_growth','proposta_publicacoes','situacoes_comerciais_versoes'].map(table=>db(`${table}?projeto_evolucao_id=eq.${encodeURIComponent(id)}&select=id&limit=1`)));
  if(linked.some(rows=>array(rows).length))return Response.json({error:'Este projeto possui histórico oficial vinculado e não pode ser excluído.'},{status:409});
  await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});return Response.json({ok:true});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível excluir o Projeto de Evolução.'},{status:500})}
}

