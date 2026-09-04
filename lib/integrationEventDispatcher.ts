type IntegrationEvent={
  id:string;
  event_type:string;
  payload:unknown;
  attempt_count:number;
};

type DispatchResult={event_id:string;delivered:boolean;http_status:number|null;attempt_count:number;error?:string};

const SUPABASE_URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const NIMBLE_URL=process.env.NIMBLE_DIAGNOSTIC_WEBHOOK_URL;
const TIMEOUT_MS=Number(process.env.NIMBLE_WEBHOOK_TIMEOUT_MS||8000);
const RETRY_SECONDS=[60,300,900,3600];

const headers=()=>({apikey:SERVICE_KEY!,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json'});
const backoffSeconds=(attempt:number)=>RETRY_SECONDS[Math.min(Math.max(attempt-1,0),RETRY_SECONDS.length-1)];

async function supabase(path:string,init?:RequestInit){
  if(!SUPABASE_URL||!SERVICE_KEY)throw new Error('Supabase não configurado para o dispatcher.');
  const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init?.headers||{})},cache:'no-store'});
  if(!response.ok)throw new Error(await response.text());
  const text=await response.text();
  return text?JSON.parse(text):[];
}

async function updateEvent(id:string,data:Record<string,unknown>){
  await supabase(`integration_events?id=eq.${encodeURIComponent(id)}`,{
    method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(data)
  });
}

export function retryDelaySeconds(attempt:number){return backoffSeconds(attempt)}

export async function dispatchDiagnosticEvents(limit=10):Promise<DispatchResult[]>{
  if(!NIMBLE_URL)throw new Error('NIMBLE_DIAGNOSTIC_WEBHOOK_URL não configurada.');
  const claimed:IntegrationEvent[]=await supabase('rpc/claim_integration_events',{
    method:'POST',body:JSON.stringify({p_limit:Math.max(1,Math.min(Number(limit)||10,50))})
  });
  const results:DispatchResult[]=[];
  for(const event of claimed){
    const attempt=Number(event.attempt_count||0)+1;
    try{
      if(!['diagnostico_concluido','solicitacao_ferramentas_concluida'].includes(event.event_type))throw new Error(`Evento não suportado pelo dispatcher: ${event.event_type}`);
      const response=await fetch(NIMBLE_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(event.payload),
        signal:AbortSignal.timeout(Math.max(1000,TIMEOUT_MS))
      });
      if(!response.ok)throw Object.assign(new Error(`Webhook Nimble respondeu HTTP ${response.status}.`),{httpStatus:response.status});
      await updateEvent(event.id,{status:'DELIVERED',attempt_count:attempt,last_error:null,last_http_status:response.status,locked_at:null,delivered_at:new Date().toISOString()});
      results.push({event_id:event.id,delivered:true,http_status:response.status,attempt_count:attempt});
    }catch(reason:any){
      const httpStatus=Number(reason?.httpStatus)||null,error=reason?.name==='TimeoutError'?'Timeout ao enviar evento para a Nimble.':String(reason?.message||'Falha desconhecida no webhook da Nimble.').slice(0,2000),nextAttempt=new Date(Date.now()+backoffSeconds(attempt)*1000).toISOString();
      await updateEvent(event.id,{status:'PENDING',attempt_count:attempt,last_error:error,last_http_status:httpStatus,locked_at:null,next_attempt_at:nextAttempt});
      results.push({event_id:event.id,delivered:false,http_status:httpStatus,attempt_count:attempt,error});
    }
  }
  return results;
}
