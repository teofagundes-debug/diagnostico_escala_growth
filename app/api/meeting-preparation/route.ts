import {isMaster} from '../../../lib/access';
import {advanceJourney} from '../../../lib/workflow';

const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
const allowed=['empresa_id','diagnostico_id','reuniao_id','hipotese_inicial','recomendacoes','prontidao','pontos_validacao','perguntas_especificas','validacoes_reuniao','parecer_reuniao','status','iniciada_em','concluida_em'];
const clean=(body:any)=>Object.fromEntries(allowed.filter(k=>body[k]!==undefined).map(k=>[k,body[k]]));
async function guard(req:Request){return Boolean(URL&&KEY)&&await isMaster(req)}
async function api(path:string,init:RequestInit={}){return fetch(`${URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init.headers||{})},cache:'no-store'})}

export async function GET(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const id=new URL(req.url).searchParams.get('id');
 const [preparations,meetings]=await Promise.all([
  api(`preparacoes_reuniao?diagnostico_id=eq.${id}&select=*&limit=1`).then(r=>r.ok?r.json():[]),
  api(`reunioes_estrategicas?diagnostico_id=eq.${id}&select=*&order=data.desc&limit=1`).then(r=>r.ok?r.json():[])
 ]);
 return Response.json({...preparations[0],meeting:meetings[0]||null});
}

export async function POST(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const body=clean(await req.json()),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id)return Response.json({error:'Empresa e diagnóstico são obrigatórios.'},{status:400});
 const existing=await api(`preparacoes_reuniao?diagnostico_id=eq.${body.diagnostico_id}&select=id&limit=1`).then(r=>r.ok?r.json():[]);
 const response=existing[0]?await api(`preparacoes_reuniao?id=eq.${existing[0].id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,updated_at:now})}):await api('preparacoes_reuniao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,created_at:now,updated_at:now})});
 if(!response.ok)return Response.json({error:'Não foi possível salvar. Execute a migração V21 no Supabase.'},{status:response.status});
 return Response.json({ok:true,preparation:(await response.json())[0]});
}

export async function PATCH(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const raw=await req.json(),body=clean(raw),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id||!body.reuniao_id)return Response.json({error:'Reunião não vinculada.'},{status:400});
 const saved=await api(`preparacoes_reuniao?diagnostico_id=eq.${body.diagnostico_id}`,{method:'PATCH',body:JSON.stringify({...body,status:'Concluída',concluida_em:now,updated_at:now})});
 if(!saved.ok)return Response.json({error:'Não foi possível concluir a preparação.'},{status:saved.status});
 await Promise.all([
  api(`reunioes_estrategicas?id=eq.${body.reuniao_id}`,{method:'PATCH',body:JSON.stringify({status:'Realizada',realizada_em:now,updated_at:now})}),
  api(`planos_estrategicos?diagnostico_id=eq.${body.diagnostico_id}`,{method:'PATCH',body:JSON.stringify({status:'Em elaboração',observacoes:body.parecer_reuniao||body.hipotese_inicial||null,updated_at:now})})
 ]);
 await advanceJourney({diagnosticoId:body.diagnostico_id,empresaId:body.empresa_id,status:'Reunião Realizada',title:'Reunião Estratégica concluída',description:'Validações registradas. O Plano Estratégico está disponível para atualização.'});
 return Response.json({ok:true});
}

