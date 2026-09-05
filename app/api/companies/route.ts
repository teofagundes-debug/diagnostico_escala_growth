import {access} from '../../../lib/access';

const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
async function rest(path:string,init:RequestInit={}){return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init.headers||{})},cache:'no-store'})}
async function rows(table:string,companyId:string,select='id'){const response=await rest(`${table}?empresa_id=eq.${encodeURIComponent(companyId)}&select=${select}`);return response.ok?response.json():[]}
async function linkedRows(table:string,column:string,value:string,select='*'){const response=await rest(`${table}?${column}=eq.${encodeURIComponent(value)}&select=${select}`);return response.ok?response.json():[]}
export async function GET(req:Request){
 try{
  const current=await access(req);
  if(!current||current.role!=='master')return Response.json({error:'Apenas Usuários Master podem consultar empresas.'},{status:403});
  const archived=new URL(req.url).searchParams.get('archived')==='true';
  if(archived){
   const companiesResponse=await rest('empresas?arquivada_em=not.is.null&select=id,nome,cpf_cnpj,arquivada_em,arquivada_por,motivo_arquivamento,created_at&order=arquivada_em.desc');
   if(!companiesResponse.ok)return new Response(await companiesResponse.text(),{status:companiesResponse.status});
   const companies=await companiesResponse.json();
   const result=[];
   for(const company of companies){
    const formalizations=await rows('formalizacoes',company.id,'*');
    const enriched=[];
    for(const formalization of formalizations){
     const documents:Record<string,any[]>={};
     for(const table of ['proposta_publicacoes','financeiro_growth','contratos_growth','aceites_growth','pagamentos_growth'])documents[table]=await linkedRows(table,'formalizacao_id',formalization.id);
     enriched.push({...formalization,documents});
    }
    const legacy:Record<string,any[]>={};
    for(const table of ['proposta_publicacoes','financeiro_growth','contratos_growth','aceites_growth','pagamentos_growth'])legacy[table]=(await rows(table,company.id,'*')).filter((record:any)=>!record.formalizacao_id);
    result.push({...company,formalizacoes:enriched,legado_sem_formalizacao:legacy});
   }
   return Response.json(result);
  }
  const [companiesResponse,diagnosticsResponse]=await Promise.all([
   rest('empresas?arquivada_em=is.null&select=id,nome,segmento,consultor_responsavel,created_at&order=created_at.desc'),
   rest('diagnosticos?select=id,empresa_id,pontuacao_geral,data_diagnostico,created_at&order=data_diagnostico.desc')
  ]);
  if(!companiesResponse.ok)return Response.json({error:'Não foi possível carregar as empresas.'},{status:companiesResponse.status});
  if(!diagnosticsResponse.ok)return Response.json({error:'Não foi possível carregar o histórico de diagnósticos.'},{status:diagnosticsResponse.status});
  const companies=await companiesResponse.json(),diagnostics=await diagnosticsResponse.json();
  return Response.json(companies.map((company:any)=>({...company,diagnosticos:diagnostics.filter((diagnostic:any)=>diagnostic.empresa_id===company.id)})));
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível carregar as empresas.'},{status:500})}
}

export async function DELETE(req:Request){
 try{
  const current=await access(req);
  if(!current||current.role!=='master')return Response.json({error:'Apenas Usuários Master podem excluir empresas.'},{status:403});
  const body=await req.json(),companyId=String(body.empresa_id||'');
  if(body.confirmacao!=='EXCLUIR')return Response.json({error:'Digite EXCLUIR para confirmar a exclusão definitiva.'},{status:400});
  if(!companyId)return Response.json({error:'Empresa não informada.'},{status:400});
  const auditReady=await rest('exclusoes_empresas_log?select=id&limit=1');
  if(!auditReady.ok)return Response.json({error:'Execute a migração V22 no Supabase antes de utilizar a exclusão definitiva.'},{status:503});
  const companyResponse=await rest(`empresas?id=eq.${encodeURIComponent(companyId)}&arquivada_em=is.null&select=id,nome&limit=1`),company=(companyResponse.ok?await companyResponse.json():[])[0];
  if(!company)return Response.json({error:'Empresa não encontrada.'},{status:404});

  const archived=await rest('rpc/arquivar_empresa_com_historico',{method:'POST',body:JSON.stringify({p_empresa_id:companyId,p_usuario_id:current.user?.id||null,p_usuario_email:current.email})});
  if(!archived.ok)return Response.json({error:`Não foi possível arquivar a empresa e seu histórico: ${(await archived.text()).slice(0,500)}. Execute a migração V73 no Supabase.`},{status:archived.status});
  const result=await archived.json();
  return Response.json({ok:true,message:'Empresa retirada da operação ativa. Formalizações e documentos foram arquivados com segurança.',...result});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível excluir a empresa.'},{status:500})}
}

