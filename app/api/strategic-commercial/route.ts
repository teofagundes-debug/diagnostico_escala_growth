import {isMaster} from '../../../lib/access';
import {STRATEGIC_INTERVENTION_CATALOG} from '../../../lib/strategicInterventionEngine';
import {resolveStrategicSolutions} from '../../../lib/strategicSolutionResolver';

const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({'Content-Type':'application/json',apikey:KEY!,Authorization:`Bearer ${KEY}`});
async function db(path:string,init?:RequestInit){const response=await fetch(`${URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init?.headers||{})},cache:'no-store'});if(!response.ok)throw new Error(await response.text());const text=await response.text();return text?JSON.parse(text):[]}
const canonical=STRATEGIC_INTERVENTION_CATALOG.map(item=>({intervention_code:item.intervention_code,title:item.title,dimension:item.dimensions[0],dimensions:item.dimensions,capability:item.capability}));
const validTypes=new Set(['PRINCIPAL','COMPLEMENTAR','PRE_REQUISITO','EVOLUCAO_FUTURA']);

async function base(){const [links,catalog,parameters]=await Promise.all([db('intervencao_solucoes?select=*&order=intervention_code,ordem'),db('catalogo_recursos?select=*&order=categoria,nome'),db('parametros_comerciais?select=*&limit=1')]);return{links,catalog,parameters:parameters[0]||null}}

export async function GET(req:Request){try{
 if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
 const empresaId=new URL(req.url).searchParams.get('empresa_id'),data=await base(),mapped=new Set(data.links.filter((item:any)=>item.ativo).map((item:any)=>item.intervention_code)),coverage={total:canonical.length,mapped:canonical.filter(item=>mapped.has(item.intervention_code)).length,unmapped:canonical.filter(item=>!mapped.has(item.intervention_code))};
 if(!empresaId)return Response.json({...data,interventions:canonical,coverage});
 const diagnostics=await db(`diagnosticos?empresa_id=eq.${encodeURIComponent(empresaId)}&select=id,relatorio_snapshot,status,created_at&order=created_at.desc&limit=1`),diagnostic=diagnostics[0];
 if(!diagnostic)return Response.json({error:'Nenhum diagnóstico foi localizado para esta empresa.'},{status:404});
 const derived=diagnostic.relatorio_snapshot?.indicadores_derivados||{},interventions=derived.strategic_interventions?.all_interventions||[],decision=derived.direcao_estrategica||null;
 if(!interventions.length)return Response.json({flow:'LEGADO',diagnostic_id:diagnostic.id,message:'Este diagnóstico ainda não possui intervenções materializadas pelo Motor Estratégico 3.0.',coverage,...data});
 const composition=resolveStrategicSolutions({interventions,links:data.links,catalog:data.catalog,valor_ui:Number(data.parameters?.valor_ui||0)});
 return Response.json({flow:'ESTRATEGICO_3_0',diagnostic_id:diagnostic.id,decision,active_interventions:interventions,composition,coverage,parameters:data.parameters,catalog:data.catalog});
}catch(error:any){return Response.json({error:error?.message||'Não foi possível preparar a composição comercial.'},{status:500})}}

export async function POST(req:Request){try{
 if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
 const body=await req.json();
 if(body.action==='save-link'){
  if(!canonical.some(item=>item.intervention_code===body.intervention_code))return Response.json({error:'Intervenção não pertence ao catálogo canônico do Motor.'},{status:400});
  if(!validTypes.has(body.tipo_vinculo))return Response.json({error:'Tipo de vínculo inválido.'},{status:400});
  const solutions=await db(`catalogo_recursos?id=eq.${encodeURIComponent(String(body.solucao_id||''))}&select=id&limit=1`);if(!solutions[0])return Response.json({error:'Solução não localizada na Biblioteca.'},{status:404});
  const payload={intervention_code:body.intervention_code,solucao_id:body.solucao_id,tipo_vinculo:body.tipo_vinculo,ordem:Math.max(0,Number(body.ordem)||0),ativo:body.ativo!==false,observacao_interna:body.observacao_interna||null,updated_at:new Date().toISOString()},saved=await db('intervencao_solucoes?on_conflict=intervention_code,solucao_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
  return Response.json({ok:true,link:saved[0]});
 }
 if(body.action==='delete-link'){await db(`intervencao_solucoes?id=eq.${encodeURIComponent(String(body.id||''))}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});return Response.json({ok:true})}
 return Response.json({error:'Ação inválida.'},{status:400});
}catch(error:any){return Response.json({error:error?.message||'Não foi possível salvar o vínculo.'},{status:500})}}

