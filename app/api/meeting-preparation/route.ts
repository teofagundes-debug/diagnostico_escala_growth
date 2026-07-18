import {isMaster} from '../../../lib/access';
import {advanceJourney} from '../../../lib/workflow';

const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
const allowed=['empresa_id','diagnostico_id','reuniao_id','hipotese_inicial','recomendacoes','prontidao','pontos_validacao','perguntas_especificas','validacoes_reuniao','parecer_reuniao','status','iniciada_em','concluida_em'];
const clean=(body:any)=>Object.fromEntries(allowed.filter(k=>body[k]!==undefined).map(k=>[k,body[k]]));
async function guard(req:Request){return Boolean(URL&&KEY)&&await isMaster(req)}
async function api(path:string,init:RequestInit={}){return fetch(`${URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init.headers||{})},cache:'no-store'})}
async function findMeeting(diagnosticId:string,companyId?:string){
 const direct=await api(`reunioes_estrategicas?diagnostico_id=eq.${encodeURIComponent(diagnosticId)}&select=*`).then(r=>r.ok?r.json():[]);
 const candidates=direct.length||!companyId?direct:await api(`reunioes_estrategicas?empresa_id=eq.${encodeURIComponent(companyId)}&select=*`).then(r=>r.ok?r.json():[]);
 return candidates.filter((x:any)=>x.status!=='Cancelada').sort((a:any,b:any)=>new Date(b.data||b.created_at).getTime()-new Date(a.data||a.created_at).getTime())[0]||null;
}

export async function GET(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const id=new URL(req.url).searchParams.get('id');
 const [preparations,diagnostics]=await Promise.all([
  api(`preparacoes_reuniao?diagnostico_id=eq.${id}&select=*&limit=1`).then(r=>r.ok?r.json():[]),
  api(`diagnosticos?id=eq.${id}&select=empresa_id&limit=1`).then(r=>r.ok?r.json():[])
 ]);
 const companyId=preparations[0]?.empresa_id||diagnostics[0]?.empresa_id;
 const meeting=await findMeeting(String(id||''),companyId);
 return Response.json({...preparations[0],reuniao_id:preparations[0]?.reuniao_id||meeting?.id||null,meeting});
}

export async function POST(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const body=clean(await req.json()),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id)return Response.json({error:'Empresa e diagnóstico são obrigatórios.'},{status:400});
 const meeting=body.reuniao_id?{id:body.reuniao_id}:await findMeeting(body.diagnostico_id,body.empresa_id);
 if(!meeting?.id)return Response.json({error:'Nenhuma Reunião Estratégica agendada foi encontrada para esta empresa. Abra a Agenda e confirme se a reunião está vinculada à empresa correta.'},{status:409});
 body.reuniao_id=meeting.id;
 const existing=await api(`preparacoes_reuniao?diagnostico_id=eq.${body.diagnostico_id}&select=id&limit=1`).then(r=>r.ok?r.json():[]);
 const response=existing[0]?await api(`preparacoes_reuniao?id=eq.${existing[0].id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,updated_at:now})}):await api('preparacoes_reuniao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,created_at:now,updated_at:now})});
 if(!response.ok)return Response.json({error:'Não foi possível salvar. Execute a migração V21 no Supabase.'},{status:response.status});
 return Response.json({ok:true,preparation:(await response.json())[0],meeting});
}

export async function PATCH(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const raw=await req.json(),body=clean(raw),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id)return Response.json({error:'Empresa e diagnóstico são obrigatórios.'},{status:400});
 if(!body.reuniao_id)body.reuniao_id=(await findMeeting(body.diagnostico_id,body.empresa_id))?.id;
 if(!body.reuniao_id)return Response.json({error:'Reunião não vinculada. Confirme o agendamento na Agenda.'},{status:400});
 const saved=await api(`preparacoes_reuniao?diagnostico_id=eq.${body.diagnostico_id}`,{method:'PATCH',body:JSON.stringify({...body,status:'Concluída',concluida_em:now,updated_at:now})});
 if(!saved.ok)return Response.json({error:'Não foi possível concluir a preparação.'},{status:saved.status});
 await Promise.all([
  api(`reunioes_estrategicas?id=eq.${body.reuniao_id}`,{method:'PATCH',body:JSON.stringify({status:'Realizada',realizada_em:now,updated_at:now})}),
  api(`planos_estrategicos?diagnostico_id=eq.${body.diagnostico_id}`,{method:'PATCH',body:JSON.stringify({status:'Em Consolidação',observacoes:body.parecer_reuniao||body.hipotese_inicial||null,updated_at:now})})
 ]);
 await advanceJourney({diagnosticoId:body.diagnostico_id,empresaId:body.empresa_id,status:'Reunião Realizada',title:'Reunião Estratégica concluída',description:'Validações registradas. O Plano Estratégico está disponível para atualização.'});
 return Response.json({ok:true});
}

