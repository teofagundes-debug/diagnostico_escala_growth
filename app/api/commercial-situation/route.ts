import {isMaster} from '../../../lib/access';

const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
export async function POST(req:Request){
 try{
  if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
  const body=await req.json(),empresaId=String(body.empresa_id||'');
  if(!empresaId)return Response.json({error:'Empresa não informada.'},{status:400});
  if(body.mensalidade===''||Number(body.mensalidade)<0)return Response.json({error:'Informe a mensalidade vigente.'},{status:400});
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/registrar_situacao_comercial`,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY!,Authorization:`Bearer ${KEY}`},body:JSON.stringify({p_empresa_id:empresaId,p_dados:{mensalidade:Number(body.mensalidade),forma_pagamento:body.forma_pagamento,status_pagamento:body.status_pagamento,contrato_status:body.contrato_status,contrato_inicio:body.contrato_inicio,responsavel:body.responsavel,observacoes:body.observacoes,motivo_alteracao:body.motivo_alteracao,recursos:Array.isArray(body.recursos)?body.recursos:[]}})});
  const text=await response.text();
  if(!response.ok){let detail=text;try{detail=JSON.parse(text)?.message||text}catch{}return Response.json({error:detail.includes('schema cache')?'Atualize o banco com a migration de salvamento da Situação Comercial e tente novamente.':detail||'Não foi possível registrar a Situação Comercial.'},{status:response.status})}
  return Response.json({ok:true,id:text?JSON.parse(text):null,message:'Situação Comercial salva e histórico atualizado.'});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível registrar a Situação Comercial.'},{status:500})}
}
