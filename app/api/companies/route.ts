import {access} from '../../../lib/access';

const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
async function rest(path:string,init:RequestInit={}){return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init.headers||{})},cache:'no-store'})}
async function rows(table:string,companyId:string,select='id'){const response=await rest(`${table}?empresa_id=eq.${encodeURIComponent(companyId)}&select=${select}`);return response.ok?response.json():[]}

function storageObject(value:any){
 try{const url=new URL(String(value||'')),prefix='/storage/v1/object/public/',index=url.pathname.indexOf(prefix);if(index<0||url.origin!==new URL(SUPABASE_URL!).origin)return null;const object=url.pathname.slice(index+prefix.length),slash=object.indexOf('/');return slash>0?{bucket:object.slice(0,slash),path:decodeURIComponent(object.slice(slash+1))}:null}catch{return null}
}

export async function DELETE(req:Request){
 try{
  const current=await access(req);
  if(!current||current.role!=='master')return Response.json({error:'Apenas Usuários Master podem excluir empresas.'},{status:403});
  const body=await req.json(),companyId=String(body.empresa_id||'');
  if(body.confirmacao!=='EXCLUIR')return Response.json({error:'Digite EXCLUIR para confirmar a exclusão definitiva.'},{status:400});
  if(!companyId)return Response.json({error:'Empresa não informada.'},{status:400});
  const companyResponse=await rest(`empresas?id=eq.${encodeURIComponent(companyId)}&select=id,nome&limit=1`),company=(companyResponse.ok?await companyResponse.json():[])[0];
  if(!company)return Response.json({error:'Empresa não encontrada.'},{status:404});

  const modules:Record<string,string>={
   diagnosticos:'diagnosticos',reunioes_estrategicas:'reunioes_estrategicas',preparacoes_reuniao:'preparacoes_reuniao',
   planos_estrategicos:'planos_estrategicos',planos_implantacao:'planos_implantacao',investimentos:'financeiro_growth',
   contratos:'contratos_growth',aceites:'aceites_growth',pagamentos:'pagamentos_growth',timeline:'dossie_eventos',
   implantacoes:'implantacoes',comunicacoes:'comunicacoes_growth',usuarios:'portal_usuarios'
  };
  const entries=await Promise.all(Object.entries(modules).map(async([label,table])=>[label,(await rows(table,companyId)).length] as const));
  const counts=Object.fromEntries(entries);
  const [diagnostics,users]=await Promise.all([rows('diagnosticos',companyId,'id,relatorio_pdf'),rows('portal_usuarios',companyId,'id,auth_user_id,email,perfil')]);
  const files=diagnostics.map((x:any)=>storageObject(x.relatorio_pdf)).filter(Boolean) as {bucket:string;path:string}[];
  const authUsers=users.filter((x:any)=>x.perfil==='cliente'&&x.auth_user_id&&x.auth_user_id!==current.user?.id).map((x:any)=>x.auth_user_id);

  const removed=await rest(`empresas?id=eq.${encodeURIComponent(companyId)}`,{method:'DELETE',headers:{Prefer:'return=representation'}});
  if(!removed.ok)return Response.json({error:'Não foi possível excluir a empresa e seus relacionamentos.'},{status:removed.status});

  let filesRemoved=0,authRemoved=0;
  for(const file of files){const response=await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(file.bucket)}/${file.path.split('/').map(encodeURIComponent).join('/')}`,{method:'DELETE',headers:{apikey:KEY!,Authorization:`Bearer ${KEY}`}});if(response.ok)filesRemoved++}
  for(const userId of authUsers){const response=await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`,{method:'DELETE',headers:headers()});if(response.ok)authRemoved++}

  const audit=await rest('exclusoes_empresas_log',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({empresa_id_excluida:company.id,empresa_nome:company.nome,usuario_id:current.user?.id||null,usuario_email:current.email,registros_removidos:{empresa:1,...counts},arquivos_removidos:filesRemoved,usuarios_auth_removidos:authRemoved})});
  if(!audit.ok)return Response.json({error:'A empresa foi excluída, mas o log não pôde ser registrado. Execute a migração V22.'},{status:500});
  return Response.json({ok:true,message:'Empresa e todos os registros relacionados foram excluídos com sucesso.',registros_removidos:{empresa:1,...counts},arquivos_removidos:filesRemoved,usuarios_auth_removidos:authRemoved});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível excluir a empresa.'},{status:500})}
}

