import {isMaster} from '../../../lib/access';
import {composeGrowthProject} from '../../../lib/motor-growth';

const SUPABASE_URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const METHOD_VERSION_FALLBACK='2.4';
const headers=()=>({'Content-Type':'application/json',apikey:SERVICE_KEY!,Authorization:`Bearer ${SERVICE_KEY}`});
async function db(path:string,init?:RequestInit){if(!SUPABASE_URL||!SERVICE_KEY)throw new Error('Supabase não configurado.');const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init?.headers||{})},cache:'no-store'});if(!response.ok)throw new Error(await response.text());const text=await response.text();return text?JSON.parse(text):[]}
const array=(value:any):any[]=>Array.isArray(value)?value:[];
const names=(items:any[])=>items.map(item=>item.nome||item.nome_snapshot).filter(Boolean);
const createSchedule=(motor:any)=>motor.schedule.map((phase:any)=>`${phase.fase}\n${phase.items.map((item:any)=>`• ${item.nome}`).join('\n')||'Nenhum item novo.'}`).join('\n\n');

async function context(empresaId:string){
 const id=encodeURIComponent(empresaId);
 const [companies,diagnostics,plans,meetings,catalog,situations,history,methodVersions]=await Promise.all([
  db(`empresas?id=eq.${id}&select=id,nome,status_implantacao&limit=1`),db(`diagnosticos?empresa_id=eq.${id}&select=*&order=created_at.desc&limit=1`),db(`planos_estrategicos?empresa_id=eq.${id}&select=*&order=created_at.desc&limit=1`),db(`reunioes_estrategicas?empresa_id=eq.${id}&select=*&order=created_at.desc&limit=1`),db('catalogo_recursos?ativo=eq.true&select=*'),db(`situacoes_comerciais_versoes?empresa_id=eq.${id}&vigente=eq.true&select=*&limit=1`),db(`regeneracoes_metodo?empresa_id=eq.${id}&select=*&order=created_at.desc`),db('metodo_growth_versoes?atual=eq.true&select=*&order=publicada_em.desc&limit=1')
 ]);
 const diagnostic=diagnostics[0],plan=plans[0],meeting=meetings[0]||{},current=situations[0],meetingData=meeting.dados_reuniao||{};
 const motor=composeGrowthProject({catalog,activeResources:names(array(current?.recursos)),priority:plan?.objetivos||plan?.prioridades||diagnostic?.menor_pilar||'Organizar',baseClient:(meeting.tipo_relacionamento||meetingData.tipo_relacionamento)==='Cliente da Base',signals:{possui_marketing:Boolean((meeting.situacao_plataforma||meetingData.situacao_plataforma||{})['Google Ads']),possui_agencia:Boolean(meetingData.possui_agencia),realiza_campanhas:Boolean(meetingData.realiza_campanhas)}});
 const currentMethod=methodVersions[0]||{nome:'Método Escala Growth',versao:METHOD_VERSION_FALLBACK,novidades:[]},planMethodVersion=plan?.metodo_versao||history[0]?.metodo_versao||'2.3',executionStarted=['Método iniciado','Cliente Ativo','Implantação concluída'].some(status=>String(companies[0]?.status_implantacao||diagnostic?.status||'').includes(status));
 return{company:companies[0],diagnostic,plan,meeting,motor,history,method:{current:currentMethod,plan_version:planMethodVersion,update_available:planMethodVersion!==currentMethod.versao,execution_started:executionStarted,last_update:history[0]||null}};
}

export async function GET(req:Request){try{if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});const empresaId=new globalThis.URL(req.url).searchParams.get('empresa_id');if(!empresaId)return Response.json({companies:await db('empresas?select=id,nome&order=nome')});return Response.json(await context(empresaId))}catch(error:any){return Response.json({error:error?.message||'Não foi possível carregar a Central de Regeneração.'},{status:500})}}

export async function POST(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const body=await req.json(),empresaId=String(body.empresa_id||''),tipo=String(body.tipo||'Plano Estratégico'),motivo=String(body.motivo||'Atualização para a versão mais recente do Método Escala Growth.');
  if(!empresaId)return Response.json({error:'Selecione uma empresa.'},{status:400});
  if(body.gerar_parecer_ia)return Response.json({error:'A geração de parecer por IA ainda não está configurada. Preserve o parecer atual ou registre um novo parecer manualmente.'},{status:409});
  const ctx=await context(empresaId);
  if(!ctx.diagnostic)return Response.json({error:'A empresa não possui diagnóstico para regeneração.'},{status:409});
  if(!ctx.plan)return Response.json({error:'A empresa não possui Plano Estratégico para regeneração.'},{status:409});
  if(ctx.method.execution_started&&!body.confirm_active)return Response.json({error:'Este projeto já iniciou sua execução utilizando a versão atual do método. Recomendamos criar um novo Projeto de Evolução ao invés de atualizar o Plano Estratégico.',code:'ACTIVE_PROJECT_CONFIRMATION'},{status:409});
  const METHOD_VERSION=ctx.method.current.versao||METHOD_VERSION_FALLBACK,previousMethodVersion=ctx.method.plan_version||'2.3';
  const previous={...ctx.plan},recommendations=names(ctx.motor.strategic),mandatory=names(ctx.motor.mandatory),future=names(ctx.motor.future);
  const next={...previous,prioridades:ctx.motor.objective,cronograma:body.atualizar_cronograma===false?previous.cronograma:createSchedule(ctx.motor),proximos_passos:body.atualizar_recomendacoes===false?previous.proximos_passos:[...mandatory,...recommendations,...future].map(item=>`• ${item}`).join('\n'),parecer_consultor:body.manter_parecer===false?null:previous.parecer_consultor,metodo_nome:ctx.method.current.nome||'Método Escala Growth',metodo_versao:METHOD_VERSION,metodo_aplicado_em:new Date().toISOString(),updated_at:new Date().toISOString()};delete next.id;delete next.created_at;
  const comparison={novos_recursos:mandatory.filter(item=>!String(previous.proximos_passos||'').includes(item)),novas_recomendacoes:recommendations.filter(item=>!String(previous.proximos_passos||'').includes(item)),evolucoes_futuras:future,mudancas:[previous.prioridades!==next.prioridades?'Prioridade estratégica recalculada':null,previous.cronograma!==next.cronograma?'Cronograma atualizado':null,previous.proximos_passos!==next.proximos_passos?'Recomendações atualizadas':null,body.manter_parecer!==false?'Parecer final preservado':null].filter(Boolean)};
  const versions=await db(`plano_estrategico_versoes?diagnostico_id=eq.${encodeURIComponent(ctx.diagnostic.id)}&select=versao&order=versao.desc&limit=1`),documentVersion=Number(versions[0]?.versao||0)+1;
  await db('plano_estrategico_versoes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({plano_id:ctx.plan.id,diagnostico_id:ctx.diagnostic.id,versao:documentVersion,consultor:body.usuario||'Usuário Master',conteudo:next,status:next.status||'Em Consolidação',motivo,metodo_versao:METHOD_VERSION,comparacao:comparison})});
  await db(`planos_estrategicos?id=eq.${encodeURIComponent(ctx.plan.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(next)});
  const version=Math.max(0,...ctx.history.filter((item:any)=>item.tipo===tipo).map((item:any)=>Number(item.versao||0)))+1;
  await db('regeneracoes_metodo',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:empresaId,diagnostico_id:ctx.diagnostic.id,plano_id:ctx.plan.id,tipo,versao:version,metodo_versao:METHOD_VERSION,versao_metodo_anterior:previousMethodVersion,versao_metodo_nova:METHOD_VERSION,motivo,usuario:body.usuario||'Usuário Master',opcoes:body,versao_anterior:previous,versao_nova:next,comparacao:comparison})});
  await db('dossie_eventos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id:empresaId,diagnostico_id:ctx.diagnostic.id,tipo:'Atualização do Método',titulo:`${tipo} atualizado`,descricao:`O ${tipo} foi atualizado da versão ${previousMethodVersion} para a versão ${METHOD_VERSION} do Método Escala Growth.`,data_evento:new Date().toISOString(),concluido:true})});
  return Response.json({ok:true,version,document_version:documentVersion,previous_method_version:previousMethodVersion,method_version:METHOD_VERSION,comparison,plan:next,message:`${tipo} atualizado para o Método Escala Growth ${METHOD_VERSION}.`});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível concluir a regeneração.'},{status:500})}
}
