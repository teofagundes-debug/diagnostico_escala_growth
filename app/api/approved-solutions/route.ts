import {isMaster} from '../../../lib/access';

const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
export async function GET(req:Request){
 try{
  if(!URL||!KEY||!await isMaster(req))return Response.json({error:'Não autorizado'},{status:401});
  const diagnosticId=new globalThis.URL(req.url).searchParams.get('diagnostico_id');
  if(!diagnosticId)return Response.json({error:'Diagnóstico não informado.'},{status:400});
  const response=await fetch(`${URL}/rest/v1/projeto_solucoes_aprovadas?diagnostico_id=eq.${encodeURIComponent(diagnosticId)}&status=eq.Aprovada&tipo=eq.Implanta%C3%A7%C3%A3o&select=*&order=aprovada_em.asc`,{headers:headers(),cache:'no-store'});
  const text=await response.text();
  if(!response.ok)return Response.json({error:text||'Não foi possível carregar as soluções aprovadas.'},{status:response.status});
  return new Response(text,{headers:{'Content-Type':'application/json; charset=utf-8'}});
 }catch(error:any){
  return Response.json({error:error?.message||'Não foi possível carregar as soluções aprovadas.'},{status:500});
 }
}
