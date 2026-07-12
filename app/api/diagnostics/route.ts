const SUPABASE_URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_KEY=process.env.CONSULTORIA_ACCESS_KEY;
const ANON_KEY=process.env.SUPABASE_ANON_KEY;
const headers=()=>({'Content-Type':'application/json','apikey':SERVICE_KEY!,'Authorization':`Bearer ${SERVICE_KEY}`});
function ready(){return SUPABASE_URL&&SERVICE_KEY}
async function admin(req:Request){if(ADMIN_KEY&&req.headers.get('authorization')===`Bearer ${ADMIN_KEY}`)return true;const token=req.headers.get('cookie')?.match(/escala_session=([^;]+)/)?.[1];if(!token||!SUPABASE_URL||!ANON_KEY)return false;const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:ANON_KEY,Authorization:`Bearer ${token}`}});return r.ok}
export async function POST(req:Request){
 if(!ready())return Response.json({error:'Persistência não configurada'},{status:503});
 const payload=await req.json();
 const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/registrar_diagnostico_growth`,{method:'POST',headers:headers(),body:JSON.stringify({payload})});
 return new Response(await r.text(),{status:r.status,headers:{'Content-Type':'application/json; charset=utf-8'}});
}
export async function GET(req:Request){
 if(!await admin(req))return Response.json({error:'Não autorizado'},{status:401});
 if(!ready())return Response.json({error:'Persistência não configurada'},{status:503});
 const url=new URL(req.url),id=url.searchParams.get('id');
 const select='*,empresas(*),responsaveis(*),resultados_pilares(*),respostas(*),respostas_abertas(*),planos_estrategicos(*),diagnostico_status_historico(*)';
 const q=id?`id=eq.${encodeURIComponent(id)}&select=${select}`:`select=id,data_diagnostico,pontuacao_geral,nivel_maturidade,maior_pilar,menor_pilar,potencial_crescimento,status,created_at,empresas(nome),responsaveis(nome)&order=created_at.desc`;
 const r=await fetch(`${SUPABASE_URL}/rest/v1/diagnosticos?${q}`,{headers:headers()});
 return new Response(await r.text(),{status:r.status,headers:{'Content-Type':'application/json; charset=utf-8'}});
}
export async function PATCH(req:Request){
 if(!await admin(req))return Response.json({error:'Não autorizado'},{status:401});
 if(!ready())return Response.json({error:'Persistência não configurada'},{status:503});
 const {id,status,observacoes,plano}=await req.json();
 if(status){await fetch(`${SUPABASE_URL}/rest/v1/diagnosticos?id=eq.${id}`,{method:'PATCH',headers:{...headers(),'Prefer':'return=minimal'},body:JSON.stringify({status,updated_at:new Date().toISOString()})});await fetch(`${SUPABASE_URL}/rest/v1/diagnostico_status_historico`,{method:'POST',headers:headers(),body:JSON.stringify({diagnostico_id:id,status})})}
 if(observacoes!==undefined||plano){await fetch(`${SUPABASE_URL}/rest/v1/planos_estrategicos?diagnostico_id=eq.${id}`,{method:'PATCH',headers:{...headers(),'Prefer':'return=minimal'},body:JSON.stringify({...plano,observacoes,updated_at:new Date().toISOString()})})}
 return Response.json({ok:true});
}

