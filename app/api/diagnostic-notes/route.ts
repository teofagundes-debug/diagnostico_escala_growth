import {isMaster} from '@/lib/access';
const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
const configured=()=>Boolean(URL&&KEY);
const validId=(value:string|null)=>Boolean(value&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

export async function GET(req:Request){
 if(!configured())return Response.json({error:'Persistência não configurada.'},{status:503});
 if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
 const id=new URL(req.url).searchParams.get('diagnostico_id');
 if(!validId(id))return Response.json({error:'Diagnóstico inválido.'},{status:400});
 const response=await fetch(`${URL}/rest/v1/diagnostico_anotacoes_consultor?diagnostico_id=eq.${encodeURIComponent(id!)}&select=conteudo,updated_at&limit=1`,{headers:headers(),cache:'no-store'});
 if(!response.ok)return Response.json({error:'A estrutura de anotações ainda não está disponível. Execute a migration V38.'},{status:response.status});
 const rows=await response.json();
 return Response.json({conteudo:rows[0]?.conteudo||'',updated_at:rows[0]?.updated_at||null});
}

export async function PUT(req:Request){
 if(!configured())return Response.json({error:'Persistência não configurada.'},{status:503});
 if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
 const body=await req.json(),id=String(body.diagnostico_id||'');
 if(!validId(id)||typeof body.conteudo!=='string')return Response.json({error:'Dados inválidos.'},{status:400});
 const diagnosticResponse=await fetch(`${URL}/rest/v1/diagnosticos?id=eq.${encodeURIComponent(id)}&select=id,empresa_id&limit=1`,{headers:headers(),cache:'no-store'}),diagnostic=(diagnosticResponse.ok?await diagnosticResponse.json():[])[0];
 if(!diagnostic?.empresa_id)return Response.json({error:'Diagnóstico não encontrado.'},{status:404});
 const response=await fetch(`${URL}/rest/v1/diagnostico_anotacoes_consultor?on_conflict=diagnostico_id`,{method:'POST',headers:{...headers(),Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({diagnostico_id:id,empresa_id:diagnostic.empresa_id,conteudo:body.conteudo,updated_at:new Date().toISOString()})});
 if(!response.ok)return Response.json({error:'Não foi possível salvar as anotações. Execute a migration V38.'},{status:response.status});
 const rows=await response.json();
 return Response.json({ok:true,updated_at:rows[0]?.updated_at||null});
}
