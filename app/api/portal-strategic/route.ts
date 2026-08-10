import {access} from '../../../lib/access';
import {buildClientStrategicView} from '../../../lib/client-strategic-portal';

const BASE=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY!}`,'Content-Type':'application/json'});
async function db(path:string){const response=await fetch(`${BASE}/rest/v1/${path}`,{headers:headers(),cache:'no-store'});if(!response.ok)throw new Error(await response.text());return response.json()}

export async function GET(req:Request){
 try{
  const actor=await access(req);if(!actor)return Response.json({error:'Não autorizado.'},{status:401});
  const url=new URL(req.url);let companyId=actor.empresa_id;
  if(actor.role==='master'&&url.searchParams.get('empresa'))companyId=url.searchParams.get('empresa');
  if(!companyId)return Response.json({error:'Empresa não informada.'},{status:400});
  const company=encodeURIComponent(companyId);
  const plans=await db(`strategic_execution_plans?empresa_id=eq.${company}&select=*&order=version_number.desc`);
  const current=plans.find((plan:any)=>plan.status==='PUBLISHED'&&plan.published_snapshot);
  const implementations=current?await db(`strategic_plan_implementations?empresa_id=eq.${company}&plan_id=eq.${encodeURIComponent(current.id)}&plan_version=eq.${encodeURIComponent(current.version_number)}&select=*&limit=1`):[];
  const implementation=implementations[0];
  const [items,measurements]=implementation?await Promise.all([db(`strategic_plan_implementation_items?implementation_id=eq.${encodeURIComponent(implementation.id)}&select=*`),db(`strategic_evolution_measurements?implementation_id=eq.${encodeURIComponent(implementation.id)}&select=*&order=measured_at.asc`)]):[[],[]];
  const measurementIds=measurements.map((item:any)=>item.id);
  const measurementItems=measurementIds.length?await db(`strategic_evolution_measurement_items?measurement_id=in.(${measurementIds.map(encodeURIComponent).join(',')})&select=*`):[];
  return Response.json({ok:true,view:buildClientStrategicView({plans,implementations,items,measurements,measurementItems})});
 }catch(error:any){console.error('[portal-strategic] Falha ao carregar visão estratégica',error);return Response.json({error:'Não foi possível carregar a Visão Estratégica.'},{status:500})}
}
