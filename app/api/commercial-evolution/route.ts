import {isMaster} from '../../../lib/access';
import {composeGrowthProject} from '../../../lib/motor-growth';

const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({'Content-Type':'application/json',apikey:KEY!,Authorization:`Bearer ${KEY}`});
const array=(value:any)=>Array.isArray(value)?value:[];
const amount=(value:unknown)=>Math.max(0,Number(value)||0);

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
 const id=encodeURIComponent(empresaId),[rawVersions,rawProjects,rawCatalog,rawFinancials,rawDiagnostics,rawMeetings,rawPlans]=await Promise.all([
  db(`situacoes_comerciais_versoes?empresa_id=eq.${id}&select=*&order=versao.desc`),
  db(`projetos_evolucao?empresa_id=eq.${id}&select=*,projeto_evolucao_recursos(*)&order=created_at.desc`),
  db('catalogo_recursos?ativo=eq.true&select=id,codigo,nome,tipo,valor_mensal,valor_avulso,ui,categoria&order=categoria,nome'),
  db(`financeiro_growth?empresa_id=eq.${id}&select=valor_mensalidade,status&limit=1`),
  db(`diagnosticos?empresa_id=eq.${id}&select=id,menor_pilar,relatorio_snapshot&order=created_at.desc&limit=1`),
  db(`reunioes_estrategicas?empresa_id=eq.${id}&select=tipo_relacionamento,situacao_plataforma,dados_reuniao&order=created_at.desc&limit=1`),
  db(`planos_estrategicos?empresa_id=eq.${id}&select=objetivos,prioridades&order=created_at.desc&limit=1`)
 ]),versions=array(rawVersions),projects=array(rawProjects),catalog=array(rawCatalog),financials=array(rawFinancials),current=versions.find((row:any)=>row.vigente)||null,diagnostic=array(rawDiagnostics)[0]||{},meeting=array(rawMeetings)[0]||{},plan=array(rawPlans)[0]||{},meetingData=meeting.dados_reuniao||{},activeNames=array(current?.recursos).map((item:any)=>item.nome_snapshot||item.nome).filter(Boolean),relationship=meeting.tipo_relacionamento||meetingData.tipo_relacionamento,baseClient=relationship==='Cliente da Base',priority=plan.objetivos||plan.prioridades||diagnostic.menor_pilar||'Organizar',platform=meeting.situacao_plataforma||meetingData.situacao_plataforma||{},motor=composeGrowthProject({catalog,activeResources:activeNames,priority,baseClient,signals:{possui_marketing:Boolean(platform['Google Ads']||platform['Meta Ads']),possui_agencia:Boolean(meetingData.possui_agencia),realiza_campanhas:Boolean(platform['Campanhas WhatsApp']||platform['Google Ads']||platform['Meta Ads'])}});
 return{current,history:versions,projects,catalog,motor,suggestion:{mensalidade:Number(financials[0]?.valor_mensalidade||0),status:financials[0]?.status||null,requiresConfirmation:versions.length===0}};
}
const projectPayload=(body:any,current:any)=>{const additional=amount(body.mensalidade_adicional),implantation=amount(body.valor_implantacao_adicional),charge=body.forma_cobranca||'Sem cobrança imediata',noCharge=['Cobrança recorrente existente','Sem cobrança imediata'].includes(charge);return{
 empresa_id:String(body.empresa_id),nome:String(body.nome||'Novo Projeto de Evolução'),tipo:body.tipo||'Inclusão de novo recurso',descricao:body.descricao||null,objetivo:body.objetivo||null,
 mensalidade_atual:amount(current?.mensalidade),mensalidade_adicional:additional,desconto_recorrente:amount(body.desconto_recorrente),valor_implantacao_adicional:implantation,
 implantacao_modalidade:body.implantacao_modalidade||'Sem cobrança',motivo_implantacao:body.motivo_implantacao||null,data_inicio:body.data_inicio||null,observacoes_internas:body.observacoes_internas||null,
 exige_contrato:Boolean(body.exige_contrato),exige_aditivo:Boolean(body.exige_aditivo),exige_aceite:body.exige_aceite!==false,exige_pagamento:Boolean(body.exige_pagamento)&&!noCharge&&(implantation>0||additional>0),
 forma_cobranca:charge,forma_pagamento_implantacao:body.forma_pagamento_implantacao||null,forma_pagamento_mensal:body.forma_pagamento_mensal||null,
 formalizacao:body.formalizacao||'Termo de adesão ao Método Escala Growth',checklist:body.checklist||{},criado_por:body.criado_por||'Usuário Master'
}};
async function replaceResources(projectId:string,resources:any[]){
 await db(`projeto_evolucao_recursos?projeto_evolucao_id=eq.${encodeURIComponent(projectId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
 if(!resources.length)return;
 await db('projeto_evolucao_recursos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(resources.map((item:any)=>({projeto_evolucao_id:projectId,recurso_id:item.id||item.recurso_id,nome_snapshot:item.nome||item.nome_snapshot,tipo_snapshot:item.tipo||item.tipo_snapshot||'Implantação',movimento:item.movimento||'Adicionar',valor_implantacao:amount(item.valor_implantacao),valor_mensal:amount(item.valor_mensal),classificacao:item.classificacao||'Recomendado',origem:item.origem||'Consultor',peso:item.peso||null,fase:item.fase||'Recomendações Estratégicas'})))});
}

export async function GET(req:Request){
 try{
  const actor=await identity(req);if(!actor)return Response.json({error:'Não autorizado.'},{status:403});
  const requested=new URL(req.url).searchParams.get('empresa_id'),empresaId=actor.role==='master'?requested:actor.empresa_id;
  if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  const result=await context(empresaId);
  if(actor.role==='cliente')return Response.json({current:result.current,projects:result.projects.filter((project:any)=>['Publicado','Aceito','Formalizado'].includes(project.status)).slice(0,1).map(({observacoes_internas,checklist,criado_por,responsavel_atualizacao,...safe}:any)=>safe)});
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
   await replaceResources(saved.id,array(source.projeto_evolucao_recursos));return Response.json({ok:true,project:saved},{status:201});
  }
  const empresaId=String(body.empresa_id||'');if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  const currentContext=await context(empresaId),duplicate=currentContext.projects.find((project:any)=>project.status==='Rascunho'&&project.tipo===body.tipo);
  if(duplicate&&!body.allow_duplicate)return Response.json({error:'Já existe um Projeto de Evolução deste tipo em andamento.',code:'DUPLICATE_DRAFT',project:duplicate},{status:409});
  const saved=(await db('projetos_evolucao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...projectPayload(body,currentContext.current),status:'Rascunho'})}))[0];
  await replaceResources(saved.id,array(body.recursos));return Response.json({ok:true,project:saved},{status:201});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível criar o Projeto de Evolução.'},{status:500})}
}

export async function PATCH(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const body=await req.json(),id=String(body.id||''),now=new Date().toISOString();if(!id)return Response.json({error:'Projeto não informado.'},{status:400});
  const existing=(await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}&select=*&limit=1`))[0];if(!existing)return Response.json({error:'Projeto não encontrado.'},{status:404});
  if(body.action==='update'){
   if(existing.status!=='Rascunho')return Response.json({error:'Somente Projetos em Rascunho podem ser editados.'},{status:409});
   const current=(await context(existing.empresa_id)).current,payload=projectPayload({...body,empresa_id:existing.empresa_id},current);
   await db(`projetos_evolucao?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({...payload,updated_at:now,responsavel_atualizacao:body.responsavel_atualizacao||'Usuário Master'})});
   await replaceResources(id,array(body.recursos));return Response.json({ok:true});
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
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível atualizar o Projeto de Evolução.'},{status:500})}
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
