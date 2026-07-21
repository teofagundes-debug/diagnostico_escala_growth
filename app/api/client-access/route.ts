import {isMaster} from '../../../lib/access';
import {advanceJourney,diagnosticContext,updatePlanJourney} from '../../../lib/workflow';
const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY,ANON=process.env.SUPABASE_ANON_KEY;
const APP=(process.env.NEXT_PUBLIC_APP_URL||'https://www.escala-growth.escalavendas.com.br').replace(/\/$/,'');
const h=()=>({'Content-Type':'application/json',apikey:KEY!,Authorization:`Bearer ${KEY}`});
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...h(),...(init.headers||{})},cache:'no-store'});if(!r.ok)throw new Error(await r.text());const text=await r.text();return text?JSON.parse(text):null}
async function companyData(empresaId:string){const company=(await rest(`empresas?id=eq.${encodeURIComponent(empresaId)}&select=id,nome&limit=1`))?.[0],responsible=(await rest(`responsaveis?empresa_id=eq.${encodeURIComponent(empresaId)}&select=nome,email,telefone&order=created_at.asc&limit=1`))?.[0];if(!company)throw new Error('Empresa não encontrada.');return{company,responsible}}
async function generateLink(email:string,existing:boolean){const expiresHours=Math.max(1,Number(process.env.CLIENT_INVITE_EXPIRY_HOURS||72));const r=await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`,{method:'POST',headers:h(),body:JSON.stringify({type:existing?'recovery':'invite',email,redirect_to:`${APP}/definir-senha`})});if(!r.ok){const message=await r.text();if(!existing&&/already|registered|exists/i.test(message))return generateLink(email,true);throw new Error(message)}const data=await r.json();return{link:data.action_link,authUserId:data.user?.id,expiresAt:new Date(Date.now()+expiresHours*3600000).toISOString()}}
async function sendEmail(input:{email:string;name:string;link:string;existing?:boolean}){const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;if(!key||!from)return{sent:false,error:'Serviço de e-mail ainda não configurado. Copie o link e envie manualmente.'};const subject=input.existing?'Cadastro de senha | Central Escala Growth':'Seu acesso à Central Escala Growth está disponível';const title=input.existing?'Cadastro de senha.':'Seu Plano Estratégico Escala Growth já está disponível.';const button=input.existing?'CADASTRAR NOVA SENHA':'CRIAR MINHA SENHA E ACESSAR';const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17231c"><h2>Olá, ${input.name}.</h2><p>${title}</p><p>Na Central você poderá acompanhar diagnóstico, planos, investimento, aceite, documentos, implantação e evolução do IEG.</p><p><a href="${input.link}" style="display:inline-block;background:#15824b;color:white;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${button}</a></p><hr><p><b>Escala Vendas</b><br>Toda empresa cresce quando consegue acompanhar cada oportunidade.</p></div>`;const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[input.email],subject,html})});return r.ok?{sent:true}:{sent:false,error:(await r.text()).slice(0,300)}}
async function audit(empresaId:string,diagnosticoId:string|undefined,title:string,description:string){await rest('dossie_eventos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:empresaId,diagnostico_id:diagnosticoId||null,tipo:'Acesso do cliente',titulo:title,descricao:description,data_evento:new Date().toISOString(),concluido:true})})}
export async function GET(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const empresaId=new URL(req.url).searchParams.get('empresa_id');
  if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  const [data,profiles,financials,publications,diagnostics,plans,implementations,acceptances,payments]=await Promise.all([
   companyData(empresaId),
   rest(`portal_usuarios?empresa_id=eq.${encodeURIComponent(empresaId)}&perfil=eq.cliente&select=*&limit=1`),
   rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&limit=1`),
   rest(`proposta_publicacoes?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=versao.desc&limit=1`).catch(()=>[]),
   rest(`diagnosticos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=created_at.desc&limit=1`),
   rest(`planos_estrategicos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`),
   rest(`planos_implantacao?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`),
   rest(`aceites_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=aceito_em.desc&limit=1`).catch(()=>[]),
   rest(`pagamentos_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=created_at.desc&limit=1`).catch(()=>[])
  ]);
  const access=profiles?.[0]||null,financial=financials?.[0]||null,publication=publications?.[0]||null,diagnostic=diagnostics?.[0]||null,plan=plans?.[0]||null,implementation=implementations?.[0]||null;
  const financialReady=Boolean(financial&&Number(financial.valor_implantacao)>0&&Number(financial.prazo_contratual)>0&&Number(financial.validade_proposta)>0&&financial.link_pix&&financial.link_cartao&&financial.link_assinatura);
  const checklist=[
   {label:'Plano Estratégico concluído',done:Boolean(plan&&['Plano Concluído','Concluído','Plano Liberado ao Cliente'].includes(plan.status))},
   {label:'Plano de Implantação aprovado',done:Boolean(implementation&&String(implementation.status||'').includes('Aprovado'))},
   {label:'Financeiro configurado',done:financialReady},
   {label:'Portal publicado',done:Boolean(publication||financial?.publicada_em)},
   {label:'Cliente acessou',done:Boolean(access?.primeiro_acesso_em)},
   {label:'Aceite realizado',done:Boolean(acceptances?.[0])},
   {label:'Pagamento confirmado',done:Boolean(payments?.[0]&&String(payments[0].status||'').toLowerCase().includes('confirm'))},
   {label:'Kickoff realizado',done:Boolean(diagnostic&&['Kickoff','Implantação','Cliente Ativo'].includes(diagnostic.status))},
   {label:'Implantação iniciada',done:Boolean(diagnostic&&['Implantação','Cliente Ativo'].includes(diagnostic.status))},
   {label:'Cliente ativo',done:Boolean(diagnostic?.status==='Cliente Ativo')}
  ];
  return Response.json({company:data.company,responsible:data.responsible,access,financial,publication,checklist});
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
  const email=String(body.email||existing?.email||data.responsible?.email||'').trim().toLowerCase(),name=String(body.nome||existing?.nome||data.responsible?.nome||'Cliente'),phone=String(body.telefone||existing?.telefone||data.responsible?.telefone||'');
  if(!email||!email.includes('@'))return Response.json({error:'Revise o e-mail do responsável.'},{status:400});
  if(action==='publish'){
   const [financial,plan,implementation,lastPublication]=await Promise.all([
    rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&limit=1`).then(x=>x?.[0]),
    rest(`planos_estrategicos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`planos_implantacao?empresa_id=eq.${encodeURIComponent(empresaId)}&select=*&order=updated_at.desc&limit=1`).then(x=>x?.[0]),
    rest(`proposta_publicacoes?empresa_id=eq.${encodeURIComponent(empresaId)}&select=versao&order=versao.desc&limit=1`).then(x=>x?.[0]).catch(()=>null)
   ]);
   const pending:string[]=[];
   if(!plan||!['Plano Concluído','Concluído','Plano Liberado ao Cliente'].includes(plan.status))pending.push('Concluir o Plano Estratégico');
   if(!implementation||!String(implementation.status||'').includes('Aprovado'))pending.push('Aprovar o Plano de Implantação');
   if(!financial)pending.push('Salvar o Financeiro');
   if(!Number(financial?.valor_implantacao||0))pending.push('Definir o valor da implantação');
   if(!Number(financial?.prazo_contratual||0))pending.push('Definir o prazo contratual');
   if(!Number(financial?.validade_proposta||0))pending.push('Definir a validade da proposta');
   if(!String(financial?.link_pix||'').trim())pending.push('Informar o Link PIX');
   if(!String(financial?.link_cartao||'').trim())pending.push('Informar o Link Cartão');
   if(!String(financial?.link_assinatura||'').trim())pending.push('Informar o Link Assinatura');
   if(pending.length)return Response.json({error:'Existem pendências antes da publicação.',pending},{status:409});
   const isExisting=Boolean(existing?.auth_user_id||existing?.primeiro_acesso_em),generated=await generateLink(email,isExisting),now=new Date().toISOString(),version=Number(lastPublication?.versao||0)+1;
   const accessPayload={email,nome:name,telefone:phone,empresa_id:empresaId,perfil:'cliente',ativo:true,auth_user_id:generated.authUserId||existing?.auth_user_id||null,status_acesso:'Convite enviado',convite_enviado_em:existing?.convite_enviado_em||now,convite_reenviado_em:existing?now:null,convite_expira_em:generated.expiresAt,convite_link:generated.link,updated_at:now};
   const saved=await rest('portal_usuarios?on_conflict=email',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(accessPayload)});
   const snapshot={financial,plan,implementation,published_at:now,version};
   await rest('proposta_publicacoes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:empresaId,diagnostico_id:ctx.diagnosticoId||null,plano_estrategico_id:plan.id,plano_implantacao_id:implementation.id,versao:version,status:'PUBLICADA',snapshot,publicada_por:String(body.usuario||'Usuário Master'),publicada_em:now})});
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
 }catch(e:any){const detail=String(e?.message||'');if(detail.includes('financeiro_growth_status_check'))return Response.json({error:'O banco ainda utiliza os status antigos do Financeiro. Execute a migration V35 no Supabase e tente novamente.'},{status:409});return Response.json({error:detail||'Não foi possível concluir a Publicação.'},{status:500})}
}
export async function PATCH(req:Request){try{const body=await req.json(),token=String(body.access_token||'');if(!token||!SUPABASE_URL||!ANON)return Response.json({error:'Convite inválido.'},{status:400});const u=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:ANON,Authorization:`Bearer ${token}`}});if(!u.ok)return Response.json({error:'Convite inválido ou expirado.'},{status:401});const user=await u.json();const invitation=(await rest(`portal_usuarios?email=eq.${encodeURIComponent(String(user.email).toLowerCase())}&select=convite_expira_em,primeiro_acesso_em&limit=1`))?.[0];if(invitation?.convite_expira_em&&new Date(invitation.convite_expira_em)<new Date())return Response.json({error:'Este convite expirou. Solicite um novo convite à Escala Vendas.'},{status:410});if(!body.password||String(body.password).length<8)return Response.json({error:'A senha deve possuir pelo menos 8 caracteres.'},{status:400});const changed=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:'PUT',headers:{apikey:ANON,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password:body.password})});if(!changed.ok)return Response.json({error:'Senha não aceita. Por favor, digite outra senha.'},{status:400});const now=new Date().toISOString();await rest(`portal_usuarios?email=eq.${encodeURIComponent(String(user.email).toLowerCase())}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({auth_user_id:user.id,status_acesso:'Acesso ativado',ativo:true,acesso_ativado_em:now,primeiro_acesso_em:invitation?.primeiro_acesso_em||now,ultimo_acesso_em:now,convite_link:null,updated_at:now})});const profile=(await rest(`portal_usuarios?email=eq.${encodeURIComponent(String(user.email).toLowerCase())}&select=empresa_id&limit=1`))?.[0];if(profile?.empresa_id){await audit(profile.empresa_id,undefined,invitation?.primeiro_acesso_em?'Acesso realizado':'Primeiro acesso realizado',invitation?.primeiro_acesso_em?'O cliente acessou novamente e atualizou sua senha.':'O cliente definiu sua senha e ativou o acesso.');const financial=(await rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(profile.empresa_id)}&select=status&limit=1`))?.[0];if(financial?.status==='Portal publicado')await rest(`financeiro_growth?empresa_id=eq.${encodeURIComponent(profile.empresa_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'Cliente acessou',updated_at:now})});}return Response.json({ok:true})}catch(e:any){return Response.json({error:e?.message||'Não foi possível ativar o acesso.'},{status:500})}}

