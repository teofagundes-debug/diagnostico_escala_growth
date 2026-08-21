import {isMaster} from '../../../../lib/access';
import {dispatchDiagnosticEvents} from '../../../../lib/integrationEventDispatcher';

function authorizedBySecret(req:Request){
  const secret=process.env.INTEGRATION_DISPATCH_SECRET;
  return Boolean(secret)&&req.headers.get('authorization')===`Bearer ${secret}`;
}

export async function POST(req:Request){
  try{
    if(!authorizedBySecret(req)&&!await isMaster(req))return Response.json({ok:false,error:'Não autorizado.'},{status:401});
    const input=await req.json().catch(()=>({}));
    const results=await dispatchDiagnosticEvents(input.limit);
    return Response.json({ok:true,processed:results.length,delivered:results.filter(item=>item.delivered).length,failed:results.filter(item=>!item.delivered).length,results});
  }catch(reason:any){
    console.error('[integration-dispatch] Falha ao processar outbox',reason);
    return Response.json({ok:false,error:reason?.message||'Não foi possível processar os eventos de integração.'},{status:500});
  }
}
