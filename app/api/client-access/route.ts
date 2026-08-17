import {isMaster} from '../../../lib/access';
import {advanceJourney,diagnosticContext,updatePlanJourney} from '../../../lib/workflow';
import {commercialFingerprint,isStrategicCommercialProject} from '../../../lib/commercialConsolidation';
import {contractDataComplete,formalizationReady,missingContractualFields,publicationReady} from '../../../lib/contractPreparation';
import {commercialConsolidationReadiness,legacyPublicationReadiness,officialImplementationReadiness,selectPublicationProject,strategicContext} from '../../../lib/clientPublicationReadiness';
const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY,ANON=process.env.SUPABASE_ANON_KEY;
const APP=(process.env.NEXT_PUBLIC_APP_URL||'https://www.escalavendas.com.br').replace(/\/$/,'');
const h=()=>({'Content-Type':'application/json',apikey:KEY!,Authorization:`Bearer ${KEY}`});
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...h(),...(init.headers||{})},cache:'no-store'});if(!r.ok)throw new Error(await r.text());const text=await r.text();return text?JSON.parse(text):null}
async function companyData(empresaId:string){const company=(await rest(`empresas?id=eq.${encodeURIComponent(empresaId)}&select=*&limit=1`))?.[0],responsible=(await rest(`responsaveis?empresa_id=eq.${encodeURIComponent(empresaId)}&select=nome,email,telefone&order=created_at.asc&limit=1`))?.[0];if(!company)throw new Error('Empresa não encontrada.');return{company,responsible}}
async function generateLink(email:string,existing:boolean){const expiresHours=Math.max(1,Number(process.env.CLIENT_INVITE_EXPIRY_HOURS||72));const r=await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`,{method:'POST',headers:h(),body:JSON.stringify({type:existing?'recovery':'invite',email,redirect_to:`${APP}/definir-senha`})});if(!r.ok){const message=await r.text();if(!existing&&/already|registered|exists/i.test(message))return generateLink(email,true);throw new Error(message)}const data=await r.json();return{link:data.action_link,authUserId:data.user?.id,expiresAt:new Date(Date.now()+expiresHours*3600000).toISOString()}}
async function sendEmail(input:{email:string;name:string;link:string;existing?:boolean}){const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;if(!key||!from)return{sent:false,error:'Serviço de e-mail ainda não configurado. Copie o link e envie manualmente.'};const subject=input.existing?'Cadastro de senha | Central Escala Growth':'Seu acesso à Central Escala Growth está disponível';const title=input.existing?'Cadastro de senha.':'Seu Plano Estratégico Escala Growth já está disponível.';const button=input.existing?'CADASTRAR NOVA SENHA':'CRIAR MINHA SENHA E ACESSAR';const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17231c"><h2>Olá, ${input.name}.</h2><p>${title}</p><p>Na Central você poderá acompanhar diagnóstico, planos, investimento, aceite, documentos, implantação e evolução do IEG.</p><p><a href="${input.link}" style="display:inline-block;background:#15824b;color:white;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${button}</a></p><hr><p><b>Escala Vendas</b><br>Toda empresa cresce quando consegue acompanhar cada oportunidade.</p></div>`;const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[input.email],subject,html})});return r.ok?{sent:true}:{sent:false,error:(await r.text()).slice(0,300)}}
async function sendWelcomeEmail(input:{email:string;name:string}){const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;if(!key||!from)return;const portalUrl=APP+'/login',html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17231c"><h2>Olá, ${input.name}.</h2><p>Seu acesso foi configurado com sucesso.</p><p>Sempre que desejar acessar sua área do cliente utilize:</p><p><a href="${portalUrl}" style="color:#15824b;font-weight:bold">${portalUrl}</a></p><p><b>Usuário:</b><br>${input.email}</p><p>Caso esqueça sua senha, entre em contato com o consultor responsável pelo seu projeto ou com a equipe da Escala Vendas para que possamos gerar um novo acesso.</p><p>Em caso de dúvidas, entre em contato com nossa equipe.</p><p><b>Equipe Escala Vendas</b></p></div>`;await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[input.email],subject:'Bem-vindo à Escala Growth',html})})}
async function audit(empresaId:string,diagnosticoId:string|undefined,title:string,description:string){await rest('dossie_eventos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:empresaId,diagnostico_id:diagnosticoId||null,tipo:'Acesso do cliente',titulo:title,descricao:description,data_evento:new Date().toISOString(),concluido:true})})}
const normalize=(value:any)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const formalizationType=(project:any)=>String(project?.formalizacao||'Contrato de Prestação de Serviços');
const usesAdhesionTerm=(project:any)=>normalize(formalizationType(project)).includes('termo');
async function officialPublicationContext(empresaId:string){
 const encoded=encodeURIComponent(empresaId),[plans,projects]=await Promise.all([
  rest(`strategic_execution_plans?empresa_id=eq.${encoded}&status=eq.PUBLISHED&published_snapshot=not.is.null&select=id,empresa_id,diagnostico_id,version_number,status,published_at,published_snapshot&order=version_number.desc&limit=1`),
  rest(`projetos_evolucao?empresa_id=eq.${encoded}&status=eq.Rascunho&select=*,projeto_evolucao_recursos(*),pendencias_inteligentes(*)&order=updated_at.desc`)
 ]),publishedPlan=plans?.[0]||null,project=selectPublicationProject(projects||[],publishedPlan),legacyFallback=Boolean(!publishedPlan&&project&&!strategicContext(project));
 let implementation=null,items:any[]=[];
 if(publishedPlan){implementation=(await rest(`strategic_plan_implementations?plan_id=eq.${encodeURIComponent(publishedPlan.id)}&plan_version=eq.${encodeURIComponent(publishedPlan.version_number)}&select=*&limit=1`))?.[0]||null;if(implementation)items=await rest(`strategic_plan_implementation_items?implementation_id=eq.${encodeURIComponent(implementation.id)}&select=*`)}
 return{publishedPlan,project,implementation,items,legacyFallback};
}
async function canonicalPublicationReadiness(context:any,financial:any){
 const implementation=officialImplementationReadiness(context.implementation,context.items);
 if(context.legacyFallback)return{legacy:true,implementation,commercial:null,legacyState:legacyPublicationReadiness(context.project)};
 let fingerprintMatches=false;if(context.project?.commercial_3_0_snapshot){const fingerprint=await commercialFingerprint(context.project);fingerprintMatches=Boolean(context.project.commercial_3_0_fingerprint&&context.project.commercial_3_0_fingerprint===fingerprint)}
 return{legacy:false,implementation,commercial:commercialConsolidationReadiness(context.project,financial,fingerprintMatches),legacyState:null};
}
export async function GET(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const empresaId=new URL(req.url).searchParams.get('empresa_id');
  if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  const [data,profiles,financials,publications,diagnostics,plans,implementations,acceptances,payments,projects,contracts,intelligentPendencies]=await Promise.all([
   companyData(empresaId),
   rest(`portal_usuarios?empresa_id=eq.${encodeURIComponent(empresaId)}&perfil=eq.cliente&select=*&limit=1`),
   rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&limit=1`),
   rest(`proposta_publicacoes?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=versao.desc&limit=1`).catch(()=>[]),
   rest(`diagnosticos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=created_at.desc&limit=1`),
   rest(`planos_estrategicos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`),
   rest(`planos_implantacao?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`),
   rest(`aceites_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=aceito_em.desc&limit=1`).catch(()=>[]),
   rest(`pagamentos_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=created_at.desc&limit=1`).catch(()=>[]),
   rest(`projetos_evolucao?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=created_at.desc&limit=1`).catch(()=>[]),
   rest(`contratos_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).catch(()=>[]),
   rest(`pendencias_inteligentes?empresa_id=eq.${encodeURIComponent(empresaId)}&status=neq.Dispensada&select=*&order=created_at`).catch(()=>[])
  ]);
  const official=await officialPublicationContext(empresaId),access=profiles?.[0]||null,financial=financials?.[0]||null,publication=financial?.snapshot_publicado?publications?.[0]||null:null,diagnostic=diagnostics?.[0]||null,plan=plans?.[0]||null,implementation=implementations?.[0]||null,legacyProject=projects?.[0]||null,project=official.project||official.legacyFallback&&legacyProject||null,contract=contracts?.[0]||null,canonical=await canonicalPublicationReadiness(official,financial);
  const requiresPayment=Boolean(project?.exige_pagamento),noAdditionalPayment=Boolean(project&&Number(project.valor_implantacao_adicional||0)===0&&Number(project.mensalidade_adicional||0)===0&&['Cobrança recorrente existente','Sem cobrança imediata'].includes(project.forma_cobranca)),financialReady=Boolean(financial&&financial.valor_implantacao!=null&&Number(financial.prazo_contratual)>0&&Number(financial.validade_proposta)>0&&(!requiresPayment||financial.link_pix||financial.link_cartao||financial.link_assinatura)),contractDataIsComplete=contractDataComplete(data.company,data.responsible),documentType=formalizationType(project),documentReady=formalizationReady(project,contract,data.company,data.responsible,usesAdhesionTerm),officialReady=canonical.legacy?Boolean(canonical.legacyState?.configuration&&canonical.legacyState?.executor&&canonical.legacyState?.financial):Boolean(official.publishedPlan&&official.project&&canonical.implementation.ready&&canonical.commercial?.ready),areaReady=publicationReady({plan:official.publishedPlan||canonical.legacy&&plan,project,financialReady:financialReady&&officialReady,documentReady,contractDataComplete:contractDataIsComplete}),contractStatus=acceptances?.[0]?.concorda_contrato?'Contrato/Termo aceito':publication?'Contrato/Termo publicado':documentReady?'Contrato/Termo disponível para revisão':project&&!contractDataIsComplete?'Dados contratuais pendentes':'Não iniciado';
  const checklist=[
   {label:'Plano Estratégico concluído',done:canonical.legacy?Boolean(plan&&['Plano Concluído','Concluído','Plano Liberado ao Cliente'].includes(plan.status)):Boolean(official.publishedPlan)},
   {label:'Projeto de Evolução preparado',done:Boolean(project&&['Rascunho','Publicado','Aceito','Formalizado'].includes(project.status))},
   {label:'Financeiro configurado',done:canonical.legacy?financialReady:Boolean(financialReady&&canonical.commercial?.ready)},
   {label:'Contrato/Termo preparado',done:documentReady,detail:documentReady?documentType:undefined},
   {label:'Área pronta para publicação',done:areaReady},
   {label:'Área publicada',done:Boolean(publication||financial?.publicada_em)},
   {label:'Primeiro acesso',done:Boolean(access?.primeiro_acesso_em)},
   {label:'Aceite',done:Boolean(acceptances?.[0])},
   {label:'Contrato',done:Boolean(acceptances?.[0]?.concorda_contrato)},
   {label:'Pagamento',done:Boolean(noAdditionalPayment||financial?.status==='Pagamento confirmado'||payments?.[0]&&String(payments[0].status||'').toLowerCase().includes('confirm')),detail:noAdditionalPayment?'Nenhuma ação financeira necessária':undefined},
   {label:'Formalização',done:Boolean(project?.status==='Formalizado')},
   {label:'Kickoff realizado',done:Boolean(diagnostic&&['Kickoff','Kickoff realizado','Implantação','Implantação em andamento','Implantação concluída','Cliente Ativo'].includes(diagnostic.status))},
   {label:'Implantação concluída',done:Boolean(diagnostic&&['Implantação concluída','Cliente Ativo'].includes(diagnostic.status))},
   {label:'Cliente Ativo',done:Boolean(diagnostic?.status==='Cliente Ativo')}
  ];
  return Response.json({company:data.company,responsible:data.responsible,access,financial,publication,project,contract,formalization_type:documentType,formalization_document_ready:documentReady,contract_status:contractStatus,contract_data_complete:contractDataIsComplete,contract_missing_fields:missingContractualFields(data.company,data.responsible).map(item=>item.label),preview_available:Boolean(diagnostic||project),preview_warning:!contractDataIsComplete?'Pré-visualização disponível, mas a Área do Cliente ainda não pode ser publicada porque existem dados contratuais pendentes.':null,checklist,intelligent_pendencies:intelligentPendencies,publication_source:{flow:canonical.legacy?'LEGACY':'STRATEGIC_EXECUTION',plan_id:official.publishedPlan?.id||null,plan_version:official.publishedPlan?.version_number||null,implementation_id:official.implementation?.id||null,project_id:project?.id||null}});
 }catch(e:any){return Response.json({error:e?.message||'Não foi possível carregar a Publicação.'},{status:500})}
}
export async function POST(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const body=await req.json(),empresaId=String(body.empresa_id||''),action=String(body.action||'publish');
  if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  const ctx=await diagnosticContext(null,empresaId),existing=(await rest(`portal_usuarios?empresa_id=eq.${encodeURIComponent(empresaId)}&perfil=eq.cliente&select=*&limit=1`))?.[0],data=await companyData(empresaId);
  if(['deactivate','reactivate'].includes(action)){
   const active=action==='reactivate';
   if(!existing)return Response.json({error:'Acesso ainda não criado.'},{status:404});
   await rest(`portal_usuarios?id=eq.${existing.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({ativo:active,status_acesso:active?'Acesso ativado':'Acesso desativado',updated_at:new Date().toISOString()})});
   await audit(empresaId,ctx.diagnosticoId,active?'Acesso reativado':'Acesso desativado',`Acesso do cliente ${active?'reativado':'desativado'} pelo Usuário Master.`);
   return Response.json({ok:true,message:active?'Acesso reativado.':'Acesso bloqueado.'});
  }
  if(action==='operational_stage'){
   const allowed:Record<string,{journey:string;project:string;mission:string}>={
    kickoff:{journey:'Kickoff realizado',project:'Kickoff realizado',mission:'Iniciar implantação'},
    implementation:{journey:'Implantação concluída',project:'Implantação concluída',mission:'Ativar cliente'},
    active:{journey:'Cliente Ativo',project:'Cliente Ativo',mission:'Acompanhar evolução do IEG'}
   };
   const stage=allowed[String(body.stage||'')];
   if(!stage)return Response.json({error:'Etapa operacional inválida.'},{status:400});
   await advanceJourney({diagnosticoId:ctx.diagnosticoId,empresaId,status:stage.journey,title:stage.project,description:`Etapa marcada manualmente pelo Usuário Master: ${stage.project}.`,manual:true});
   await Promise.all([
    rest(`empresas?id=eq.${encodeURIComponent(empresaId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status_implantacao:stage.project,proxima_missao:{titulo:stage.mission,responsavel:'Escala Vendas e cliente',status:'Pendente'},updated_at:new Date().toISOString()})}),
    body.stage==='implementation'?rest(`planos_implantacao?empresa_id=eq.${encodeURIComponent(empresaId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Implantação Concluída',updated_at:new Date().toISOString()})}):Promise.resolve()
   ]);
   if(body.stage==='kickoff'){
    const project=(await rest(`projetos_evolucao?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*,projeto_evolucao_recursos(*)&order=created_at.desc&limit=1`))?.[0],now=new Date().toISOString();
    if(project){
     await rest(`projetos_evolucao?id=eq.${encodeURIComponent(project.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Kickoff realizado',updated_at:now})});
     const marketing=(project.projeto_evolucao_recursos||[]).filter((item:any)=>item.implantar_nesta_fase===true&&(item.parametros_snapshot?.abre_planejamento_operacional===true||['google ads','meta ads','landing page','campanhas whatsapp'].some(name=>String(item.nome_snapshot||'').toLowerCase().includes(name))));
     for(const item of marketing){const name=String(item.nome_snapshot||''),platform=/google/i.test(name)?'Google Ads':/meta/i.test(name)?'Meta Ads':/landing/i.test(name)?'Landing Page':/whatsapp/i.test(name)?'Campanhas WhatsApp':name;await rest('planejamentos_campanhas?on_conflict=projeto_evolucao_id,recurso_id,plataforma',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({empresa_id:empresaId,projeto_evolucao_id:project.id,recurso_id:item.recurso_id,plataforma:platform,objetivo:item.parametros_snapshot?.objetivo_padrao||item.executor_dados?.objetivo||null,investimento_recomendado:Number(item.investimento_recomendado||0),investimento_aprovado:Number(item.investimento_aprovado||0),executor:item.executor||null,responsavel_configuracao:'Equipe de Implantação',status:'Planejamento',updated_at:now})})}
     if(marketing.length){const existingPendency=(await rest(`pendencias_inteligentes?projeto_evolucao_id=eq.${encodeURIComponent(project.id)}&codigo=eq.MARKETING_PARAMETROS&select=id&limit=1`))?.[0],pendency={empresa_id:empresaId,projeto_evolucao_id:project.id,codigo:'MARKETING_PARAMETROS',titulo:'Planejamento Operacional das Campanhas',categoria:'Implantação',status:'Pendente',rota_configuracao:'/central/parametros-marketing',updated_at:now};await rest(existingPendency?`pendencias_inteligentes?id=eq.${encodeURIComponent(existingPendency.id)}`:'pendencias_inteligentes',{method:existingPendency?'PATCH':'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(pendency)})}
    }
   }
   await audit(empresaId,ctx.diagnosticoId,stage.project,`Etapa operacional atualizada manualmente para ${stage.project}.`);
   return Response.json({ok:true,message:`${stage.project} registrado com sucesso.`});
  }
  if(action==='review_contract'){
   const contract=(await rest(`contratos_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`))?.[0],missing=missingContractualFields(data.company,data.responsible).map(item=>item.label);
   if(!contract)return Response.json({error:'O contrato ainda não foi iniciado.'},{status:409});
   if(missing.length)return Response.json({error:'Complete os dados contratuais antes da revisão.',pending:missing},{status:409});
   await rest(`contratos_growth?id=eq.${encodeURIComponent(contract.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Revisado',updated_at:new Date().toISOString()})});
   await audit(empresaId,ctx.diagnosticoId,'Contrato revisado','Contrato conferido pelo Usuário Master e liberado para publicação.');
   return Response.json({ok:true,message:'Contrato revisado e pronto para publicação.'});
  }
  if(action==='update_publication'){
   const projectId=String(body.project_id||'');
   const [financial,plan,implementation,project,contract,diagnostic,lastPublication]=await Promise.all([
    rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&limit=1`).then(x=>x?.[0]),
    rest(`planos_estrategicos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`planos_implantacao?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`projetos_evolucao?id=eq.${encodeURIComponent(projectId)}&empresa_id=eq.${encodeURIComponent(empresaId)}&select=*,projeto_evolucao_recursos(*),pendencias_inteligentes(*)&limit=1`).then(x=>x?.[0]),
    rest(`contratos_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`diagnosticos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=created_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`proposta_publicacoes?empresa_id=eq.${encodeURIComponent(empresaId)}&status=eq.PUBLICADA&select=*&order=versao.desc&limit=1`).then(x=>x?.[0]).catch(()=>null)
   ]);
   if(!project||!lastPublication)return Response.json({error:'Não existe uma publicação anterior desta empresa para atualizar.'},{status:409});
   if(!isStrategicCommercialProject(project)||project.commercial_3_0_status!=='PRONTO'||!project.commercial_3_0_snapshot)return Response.json({error:'Conclua novamente a Consolidação Comercial 3.0 antes de atualizar o cliente.'},{status:409});
   const currentFingerprint=await commercialFingerprint(project);
   if(project.commercial_3_0_fingerprint!==currentFingerprint)return Response.json({error:'A consolidação está desatualizada. Consolide novamente antes de atualizar o cliente.'},{status:409});
   const consolidated=project.commercial_3_0_snapshot,currentResources=project.projeto_evolucao_recursos||[],snapshotResources=consolidated.resources||[],publishedResources=lastPublication.snapshot?.commercial_3_0?.resources||[];
   if(currentResources.length!==snapshotResources.length)return Response.json({error:'Os recursos do Projeto divergem do snapshot consolidado. Revise a Composição Comercial 3.0.'},{status:409});
   if(!snapshotResources.length&&publishedResources.length)return Response.json({error:`Atualização bloqueada: a versão publicada possui ${publishedResources.length} recursos e o novo snapshot está vazio. Revise os vínculos canônicos antes de continuar.`,code:'EMPTY_RESOURCE_REGRESSION'},{status:409});
   const now=new Date().toISOString(),version=Number(lastPublication.versao||0)+1,consolidatedResources=snapshotResources.map((item:any)=>({id:item.recurso_id,nome:item.nome,tipo:item.tipo,status:'Contratado',valor_implantacao:item.implantacao,valor_mensal:item.mensalidade,parametros_snapshot:item.parametros_snapshot})),snapshotFinancial={...financial,valor_implantacao:consolidated.financial.valor_implantacao,valor_mensalidade:consolidated.financial.valor_mensalidade,prazo_contratual:consolidated.financial.prazo_contratual,validade_proposta:consolidated.financial.validade_proposta,desconto_pix:consolidated.financial.desconto_pix},snapshotImplementation={...(implementation||{}),recursos:consolidatedResources,valor_implantacao:consolidated.financial.valor_implantacao,investimento:{...(implementation?.investimento||{}),implantacao:consolidated.financial.valor_implantacao,mensalidade:consolidated.financial.valor_mensalidade}},formalizationDocument=contract?{...contract,commercial_3_0:consolidated.document||null}:lastPublication.snapshot?.formalization_document||null,snapshot={financial:snapshotFinancial,plan,implementation:snapshotImplementation,project,commercial_3_0:consolidated,contract:formalizationDocument,formalization_document:formalizationDocument,orientacoes_iniciais:lastPublication.snapshot?.orientacoes_iniciais,published_at:now,version,updated_from_version:lastPublication.versao};
   await rest('proposta_publicacoes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:empresaId,diagnostico_id:diagnostic?.id||ctx.diagnosticoId||null,plano_estrategico_id:plan?.id||null,plano_implantacao_id:implementation?.id||null,projeto_evolucao_id:project.id,versao:version,status:'PUBLICADA',snapshot,publicada_por:String(body.usuario||'Usuário Master'),publicada_em:now})});
   await Promise.all([
    rest(`projetos_evolucao?id=eq.${encodeURIComponent(project.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Publicado',publicado_em:now,updated_at:now,responsavel_atualizacao:String(body.usuario||'Usuário Master')})}),
    rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(empresaId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({valor_implantacao:consolidated.financial.valor_implantacao,valor_mensalidade:consolidated.financial.valor_mensalidade,prazo_contratual:consolidated.financial.prazo_contratual,validade_proposta:consolidated.financial.validade_proposta,desconto_pix:consolidated.financial.desconto_pix,publicada_em:now,publicada_por:String(body.usuario||'Usuário Master'),versao_publicada:version,snapshot_publicado:snapshot,updated_at:now})})
   ]);
   await audit(empresaId,ctx.diagnosticoId,'Projeto de Evolução atualizado no Portal',`Versão ${version} atualizada explicitamente por ${String(body.usuario||'Usuário Master')}, substituindo a versão ${lastPublication.versao} no Portal do Cliente.`);
   return Response.json({ok:true,message:'Projeto atualizado para o cliente com sucesso.',publication:{versao:version,publicada_em:now},resources_count:snapshotResources.length});
  }
  const email=String(body.email||existing?.email||data.responsible?.email||'').trim().toLowerCase(),name=String(body.nome||existing?.nome||data.responsible?.nome||'Cliente'),phone=String(body.telefone||existing?.telefone||data.responsible?.telefone||'');
  if(!email||!email.includes('@'))return Response.json({error:'Revise o e-mail do responsável.'},{status:400});
  if(action==='publish'){
   const official=await officialPublicationContext(empresaId),[financial,plan,implementation,legacyProject,contract,diagnostic,lastPublication]=await Promise.all([
    rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&limit=1`).then(x=>x?.[0]),
    rest(`planos_estrategicos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`planos_implantacao?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`projetos_evolucao?empresa_id=eq.${encodeURIComponent(empresaId)}&status=eq.Rascunho&select=*,projeto_evolucao_recursos(*),pendencias_inteligentes(*)&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`contratos_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`diagnosticos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=created_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`proposta_publicacoes?empresa_id=eq.${encodeURIComponent(empresaId)}&select=versao&order=versao.desc&limit=1`).then(x=>x?.[0]).catch(()=>null)
   ]),project=official.project||official.legacyFallback&&legacyProject||null,canonical=await canonicalPublicationReadiness(official,financial);
   const pending:string[]=[];
    const documentType=formalizationType(project),documentReady=formalizationReady(project,contract,data.company,data.responsible,usesAdhesionTerm),termSelected=usesAdhesionTerm(project);
   if(!diagnostic)pending.push('Concluir o Diagnóstico');
   if(!String(plan?.parecer_consultor||diagnostic?.parecer_consultor||diagnostic?.parecer||'').trim())pending.push('Preencher o Parecer do Consultor');
    if(canonical.legacy&&(!plan||!['Plano Concluído','Concluído','Plano Liberado ao Cliente'].includes(plan.status)))pending.push('Concluir o Plano Estratégico');
    if(canonical.legacy){
     if(!project)pending.push('Preparar um Projeto de Evolução em Rascunho');
     if(project&&!canonical.legacyState?.configuration)pending.push('Concluir as Configurações da Implantação');
     if(project&&!canonical.legacyState?.executor)pending.push('Definir a Estratégia de Execução e o executor de cada solução recomendada');
     if(project&&!project.checklist?.estrategia_marketing_definida)pending.push('Definir a Estratégia de Marketing');
     if(project&&!project.checklist?.investimento_aprovado_registrado)pending.push('Registrar o investimento aprovado para esta fase');
     if(project&&!canonical.legacyState?.financial)pending.push('Atualizar o Resumo Financeiro');
    }else{
     if(!official.publishedPlan)pending.push('Plano Estratégico publicado não encontrado.');
     if(official.publishedPlan&&!project)pending.push('Projeto de Evolução não corresponde ao Plano Estratégico vigente.');
     if(official.publishedPlan&&!official.implementation)pending.push('Implantação oficial da versão publicada não encontrada.');
     if(official.implementation&&!canonical.implementation.hasItems)pending.push('A Implantação oficial não possui ações operacionais.');
     if(canonical.implementation.missingResponsible.length)pending.push('Existem ações de implantação sem responsável.');
     if(canonical.implementation.missingDue.length)pending.push('Existem ações de implantação sem prazo.');
     if(project&&!canonical.commercial?.ready)pending.push('Consolidação Comercial 3.0 ainda possui divergências.');
    }
   if(!documentReady)pending.push('Prepare o Contrato/Termo para continuar.');
   if(!termSelected&&contract&&contract.status!=='Revisado')pending.push('Revisar e confirmar o Contrato/Termo');
   for(const item of missingContractualFields(data.company,data.responsible))pending.push(`Completar ${item.label}`);
   if(!financial)pending.push('Salvar o Financeiro');
   if(financial?.valor_implantacao==null)pending.push('Definir o valor da implantação');
   if(!Number(financial?.prazo_contratual||0))pending.push('Definir o prazo contratual');
   if(!Number(financial?.validade_proposta||0))pending.push('Definir a validade da proposta');
   if(project?.exige_pagamento&&!String(financial?.link_pix||financial?.link_cartao||financial?.link_assinatura||'').trim())pending.push('Informar ao menos um link de pagamento');
   if(pending.length)return Response.json({error:'Existem pendências antes da publicação.',pending},{status:409});
   const intelligentPendencies=await rest(`pendencias_inteligentes?projeto_evolucao_id=eq.${encodeURIComponent(project.id)}&status=eq.Pendente&select=titulo,codigo`),marketingPending=intelligentPendencies?.some((item:any)=>item.codigo==='MARKETING_PARAMETROS');
   if(intelligentPendencies?.length&&!body.confirm_pendencies)return Response.json({error:marketingPending?'Existem recomendações de Marketing sem parâmetros definidos.':'Atenção. Ainda existem configurações recomendadas que deverão ser concluídas durante a implantação.',pending:intelligentPendencies.map((item:any)=>item.titulo),code:'INTELLIGENT_PENDENCIES'},{status:409});
   const isExisting=Boolean(existing?.auth_user_id||existing?.primeiro_acesso_em),generated=await generateLink(email,isExisting),now=new Date().toISOString(),version=Number(lastPublication?.versao||0)+1;
   const accessPayload={email,nome:name,telefone:phone,empresa_id:empresaId,perfil:'cliente',ativo:true,auth_user_id:generated.authUserId||existing?.auth_user_id||null,status_acesso:'Convite enviado',convite_enviado_em:existing?.convite_enviado_em||now,convite_reenviado_em:existing?now:null,convite_expira_em:generated.expiresAt,convite_link:generated.link,updated_at:now};
   const saved=await rest('portal_usuarios?on_conflict=email',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(accessPayload)});
   const consolidated=strategic3?project.commercial_3_0_snapshot:null,consolidatedResources=(consolidated?.resources||[]).map((item:any)=>({id:item.recurso_id,nome:item.nome,tipo:item.tipo,status:'Contratado',valor_implantacao:item.implantacao,valor_mensal:item.mensalidade,parametros_snapshot:item.parametros_snapshot})),snapshotFinancial=consolidated?{...financial,valor_implantacao:consolidated.financial.valor_implantacao,valor_mensalidade:consolidated.financial.valor_mensalidade,prazo_contratual:consolidated.financial.prazo_contratual,validade_proposta:consolidated.financial.validade_proposta,desconto_pix:consolidated.financial.desconto_pix}:financial,snapshotImplementation=consolidated?{...(implementation||{}),recursos:consolidatedResources,valor_implantacao:consolidated.financial.valor_implantacao,investimento:{...(implementation?.investimento||{}),implantacao:consolidated.financial.valor_implantacao,mensalidade:consolidated.financial.valor_mensalidade}}:implementation;
   const formalizationDocument=contract?{...contract,commercial_3_0:consolidated?.document||null}:{titulo:documentType,status:'Publicado',tipo:'Termo de Adesão',gerado_automaticamente:true,commercial_3_0:consolidated?.document||null,created_at:now,updated_at:now};
   const snapshot={financial:snapshotFinancial,plan,implementation:snapshotImplementation,project,commercial_3_0:consolidated,contract:formalizationDocument,formalization_document:formalizationDocument,orientacoes_iniciais:'Revise o Plano Estratégico, o Projeto de Evolução e o Contrato/Termo. Em seguida, conclua o aceite para dar continuidade ao Método Escala Growth.',published_at:now,version};
   await rest('proposta_publicacoes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:empresaId,diagnostico_id:ctx.diagnosticoId||null,plano_estrategico_id:plan.id,plano_implantacao_id:implementation?.id||null,projeto_evolucao_id:project.id,versao:version,status:'PUBLICADA',snapshot,publicada_por:String(body.usuario||'Usuário Master'),publicada_em:now})});
   await Promise.all([
    rest(`projetos_evolucao?id=eq.${encodeURIComponent(project.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Publicado',publicado_em:now,updated_at:now})}),
    contract?rest(`contratos_growth?id=eq.${encodeURIComponent(contract.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({projeto_evolucao_id:project.id,status:'Publicado',updated_at:now})}):Promise.resolve()
   ]);
   await rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(empresaId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Portal publicado',publicada_em:now,publicada_por:String(body.usuario||'Usuário Master'),versao_publicada:version,snapshot_publicado:snapshot,updated_at:now})});
   const mail=await sendEmail({email,name,link:generated.link,existing:isExisting});
   if(ctx.diagnosticoId)await updatePlanJourney(ctx.diagnosticoId,'release');
   await audit(empresaId,ctx.diagnosticoId,'Portal do Cliente publicado',`Versão ${version} publicada por ${String(body.usuario||'Usuário Master')}. Convite ${mail.sent?'enviado':'gerado'} para ${email}.`);
   return Response.json({ok:true,access:saved?.[0],publication:{versao:version,publicada_em:now},link:generated.link,email_sent:mail.sent,email_error:mail.error||null,message:mail.sent?'Portal publicado e convite enviado.':'Portal publicado; envie manualmente o link de acesso.'});
  }
  const isExisting=Boolean(existing?.auth_user_id||existing?.primeiro_acesso_em),generated=await generateLink(email,isExisting||action==='resend'||action==='reset'),now=new Date().toISOString();
  const payload={email,nome:name,telefone:phone,empresa_id:empresaId,perfil:'cliente',ativo:true,auth_user_id:generated.authUserId||existing?.auth_user_id||null,status_acesso:'Convite enviado',convite_enviado_em:existing?.convite_enviado_em||now,convite_reenviado_em:existing?now:null,convite_expira_em:generated.expiresAt,convite_link:generated.link,updated_at:now};
  const saved=await rest('portal_usuarios?on_conflict=email',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
  const mail=await sendEmail({email,name,link:generated.link,existing:isExisting});
  await audit(empresaId,ctx.diagnosticoId,existing?'Convite reenviado':'Acesso criado',`Convite ${mail.sent?'enviado':'gerado'} para ${email}.`);
  if(['create_release','release_existing'].includes(action)&&ctx.diagnosticoId){await updatePlanJourney(ctx.diagnosticoId,'release');await audit(empresaId,ctx.diagnosticoId,'Proposta liberada','Conteúdo liberado ao cliente pelo Usuário Master.')}
  return Response.json({ok:true,access:saved?.[0],link:generated.link,email_sent:mail.sent,email_error:mail.error||null,message:mail.sent?'Convite enviado.':'Convite gerado; envie o link manualmente.'});
 }catch(e:any){const detail=String(e?.message||'');if(detail.includes('financeiro_growth_status_check'))return Response.json({error:'O banco ainda utiliza os status antigos do Financeiro. Execute a migration V35 no Supabase e tente novamente.'},{status:409});if(detail.includes('projetos_evolucao_status_check'))return Response.json({error:'O banco ainda utiliza os status antigos dos Projetos de Evolução. Execute a migration de governança dos projetos no Supabase e tente publicar novamente.'},{status:409});return Response.json({error:detail||'Não foi possível concluir a Publicação.'},{status:500})}
}
export async function PATCH(req:Request){try{const body=await req.json(),token=String(body.access_token||'');if(!token||!SUPABASE_URL||!ANON)return Response.json({error:'Convite inválido.'},{status:400});const u=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:ANON,Authorization:`Bearer ${token}`}});if(!u.ok)return Response.json({error:'Convite inválido ou expirado.'},{status:401});const user=await u.json();const invitation=(await rest(`portal_usuarios?email=eq.${encodeURIComponent(String(user.email).toLowerCase())}&select=convite_expira_em,primeiro_acesso_em&limit=1`))?.[0];if(invitation?.convite_expira_em&&new Date(invitation.convite_expira_em)<new Date())return Response.json({error:'Este convite expirou. Solicite um novo convite à Escala Vendas.'},{status:410});if(!body.password||String(body.password).length<8)return Response.json({error:'A senha deve possuir pelo menos 8 caracteres.'},{status:400});const changed=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:'PUT',headers:{apikey:ANON,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password:body.password})});if(!changed.ok)return Response.json({error:'Senha não aceita. Por favor, digite outra senha.'},{status:400});const now=new Date().toISOString();await rest(`portal_usuarios?email=eq.${encodeURIComponent(String(user.email).toLowerCase())}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({auth_user_id:user.id,status_acesso:'Acesso ativado',ativo:true,acesso_ativado_em:now,primeiro_acesso_em:invitation?.primeiro_acesso_em||now,ultimo_acesso_em:now,convite_link:null,updated_at:now})});const profile=(await rest(`portal_usuarios?email=eq.${encodeURIComponent(String(user.email).toLowerCase())}&select=empresa_id,nome&limit=1`))?.[0];if(profile?.empresa_id){await sendWelcomeEmail({email:String(user.email).toLowerCase(),name:profile.nome||'Cliente'}).catch(()=>{});await audit(profile.empresa_id,undefined,invitation?.primeiro_acesso_em?'Acesso realizado':'Primeiro acesso realizado',invitation?.primeiro_acesso_em?'O cliente acessou novamente e atualizou sua senha.':'O cliente definiu sua senha e ativou o acesso.');const financial=(await rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(profile.empresa_id)}&select=status&limit=1`))?.[0];if(financial?.status==='Portal publicado')await rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(profile.empresa_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Cliente acessou',updated_at:now})});}return Response.json({ok:true})}catch(e:any){return Response.json({error:e?.message||'Não foi possível ativar o acesso.'},{status:500})}}

