import {access,isMaster} from '../../../lib/access';
import {advanceJourney} from '../../../lib/workflow';

const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
const allowed=['empresa_id','diagnostico_id','reuniao_id','hipotese_inicial','recomendacoes','prontidao','pontos_validacao','perguntas_especificas','validacoes_reuniao','parecer_reuniao','problema_principal','ajustes_diagnostico','prioridades_confirmadas','recomendacoes_aprovadas','recomendacoes_removidas','novas_recomendacoes','informacoes_complementares','missao_definida','indicadores_sugeridos','observacoes_consultor','parecer_consultor','responsavel_reuniao','status','iniciada_em','concluida_em','ultima_alteracao_em'];
const clean=(body:any)=>Object.fromEntries(allowed.filter(k=>body[k]!==undefined).map(k=>[k,body[k]]));
async function guard(req:Request){return Boolean(URL&&KEY)&&await isMaster(req)}
async function api(path:string,init:RequestInit={}){return fetch(`${URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init.headers||{})},cache:'no-store'})}
async function findMeeting(diagnosticId:string,companyId?:string){
 const direct=await api(`reunioes_estrategicas?diagnostico_id=eq.${encodeURIComponent(diagnosticId)}&select=*`).then(r=>r.ok?r.json():[]);
 const candidates=direct.length||!companyId?direct:await api(`reunioes_estrategicas?empresa_id=eq.${encodeURIComponent(companyId)}&select=*`).then(r=>r.ok?r.json():[]);
 return candidates.filter((x:any)=>x.status!=='Cancelada').sort((a:any,b:any)=>new Date(b.data||b.created_at).getTime()-new Date(a.data||a.created_at).getTime())[0]||null;
}

export async function GET(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const requestUrl=new URL(req.url);if(requestUrl.searchParams.get('list')==='1'){const response=await api('preparacoes_reuniao?select=*&order=updated_at.desc');return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'application/json; charset=utf-8'}})}
 const id=requestUrl.searchParams.get('id'),meetingId=requestUrl.searchParams.get('meeting_id');
 const diagnostics=await api(`diagnosticos?id=eq.${id}&select=empresa_id&limit=1`).then(r=>r.ok?r.json():[]);
 const companyId=diagnostics[0]?.empresa_id;
 const meeting=meetingId?await api(`reunioes_estrategicas?id=eq.${encodeURIComponent(meetingId)}&select=*&limit=1`).then(r=>r.ok?r.json():[]).then(x=>x[0]||null):await findMeeting(String(id||''),companyId);
 let preparations=meeting?.id?await api(`preparacoes_reuniao?reuniao_id=eq.${encodeURIComponent(meeting.id)}&select=*&order=updated_at.desc&limit=1`).then(r=>r.ok?r.json():[]):[];
 if(!preparations[0]&&meeting?.preparacao_id)preparations=await api(`preparacoes_reuniao?id=eq.${encodeURIComponent(meeting.preparacao_id)}&select=*&limit=1`).then(r=>r.ok?r.json():[]);
 if(!preparations[0]&&id)preparations=await api(`preparacoes_reuniao?diagnostico_id=eq.${encodeURIComponent(id)}&select=*&order=updated_at.desc&limit=1`).then(r=>r.ok?r.json():[]);
 let preparation=preparations[0]||{};
 const hasReadiness=Object.values(preparation.prontidao||{}).some(Boolean);
 if(!hasReadiness&&meeting?.id){
  const history=await api(`reuniao_estrategica_historico?reuniao_id=eq.${encodeURIComponent(meeting.id)}&select=snapshot&order=created_at.desc`).then(r=>r.ok?r.json():[]);
  const recovered=history.map((item:any)=>item.snapshot?.prontidao).find((value:any)=>value&&Object.values(value).some(Boolean));
  if(recovered)preparation={...preparation,prontidao:recovered};
 }
 return Response.json({...preparation,reuniao_id:preparation.reuniao_id||meeting?.id||null,meeting});
}

export async function POST(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const current=await access(req),body=clean(await req.json()),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id)return Response.json({error:'Empresa e diagnóstico são obrigatórios.'},{status:400});
 const meeting=body.reuniao_id?{id:body.reuniao_id}:await findMeeting(body.diagnostico_id,body.empresa_id);
 if(!meeting?.id)return Response.json({error:'Nenhuma Reunião Estratégica agendada foi encontrada para esta empresa. Abra a Agenda e confirme se a reunião está vinculada à empresa correta.'},{status:409});
 body.reuniao_id=meeting.id;
 body.responsavel_reuniao=body.responsavel_reuniao||current?.email||'Usuário Master';body.ultima_alteracao_em=now;
 const existing=await api(`preparacoes_reuniao?reuniao_id=eq.${body.reuniao_id}&select=id&limit=1`).then(r=>r.ok?r.json():[]);
 const response=existing[0]?await api(`preparacoes_reuniao?id=eq.${existing[0].id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,updated_at:now})}):await api('preparacoes_reuniao',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,created_at:now,updated_at:now})});
 if(!response.ok)return Response.json({error:'Não foi possível salvar. Execute a migração V23 no Supabase.'},{status:response.status});
 const preparation=(await response.json())[0];
 const readinessPercent=Math.min(100,Math.round(Object.values(body.prontidao||{}).filter(Boolean).length/6*100)),stage=body.status==='Em condução'?'Reunião iniciada':readinessPercent>=100?'Preparação concluída':'Preparação em andamento';
 await Promise.all([
  api(`reunioes_estrategicas?id=eq.${meeting.id}`,{method:'PATCH',body:JSON.stringify({preparacao_id:preparation.id,etapa_atual:stage,prontidao_percentual:readinessPercent,observacoes:body.observacoes_consultor||null,consultor:body.responsavel_reuniao,updated_at:now})}),
  api('reuniao_estrategica_historico',{method:'POST',body:JSON.stringify({empresa_id:body.empresa_id,diagnostico_id:body.diagnostico_id,reuniao_id:meeting.id,preparacao_id:preparation.id,acao:'Reunião salva',responsavel:body.responsavel_reuniao,status:body.status||'Em condução',snapshot:body})})
 ]);
 return Response.json({ok:true,message:'Reunião salva com sucesso.',preparation,meeting});
}

export async function PATCH(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const current=await access(req),raw=await req.json(),body=clean(raw),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id)return Response.json({error:'Empresa e diagnóstico são obrigatórios.'},{status:400});
 if(!body.reuniao_id)body.reuniao_id=(await findMeeting(body.diagnostico_id,body.empresa_id))?.id;
 if(!body.reuniao_id)return Response.json({error:'Reunião não vinculada. Confirme o agendamento na Agenda.'},{status:400});
 if(!body.problema_principal?.trim()||!body.prioridades_confirmadas?.trim()||!body.missao_definida?.trim())return Response.json({error:'Preencha Problema Principal, Prioridades Confirmadas e Missão Definida antes de concluir.'},{status:400});
 body.responsavel_reuniao=body.responsavel_reuniao||current?.email||'Usuário Master';body.ultima_alteracao_em=now;
 const saved=await api(`preparacoes_reuniao?reuniao_id=eq.${body.reuniao_id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,status:'Concluída',concluida_em:now,updated_at:now})});
 if(!saved.ok)return Response.json({error:'Não foi possível concluir a preparação.'},{status:saved.status});
 const preparation=(await saved.json())[0];
 const implementation=await api(`planos_implantacao?diagnostico_id=eq.${body.diagnostico_id}&select=*&limit=1`).then(r=>r.ok?r.json():[]);
 const currentImplementation=implementation[0],lines=(value:any)=>String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const approved=lines(body.recomendacoes_aprovadas),removed=lines(body.recomendacoes_removidas),added=lines(body.novas_recomendacoes),existingResources=Array.isArray(currentImplementation?.recursos)?currentImplementation.recursos:[];
 const resources=existingResources.map((item:any)=>removed.some(x=>item.nome?.toLowerCase()===x.toLowerCase())?{...item,status:'Não recomendado'}:approved.some(x=>item.nome?.toLowerCase()===x.toLowerCase())?{...item,status:'Recomendado'}:item);
 for(const name of added)if(!resources.some((x:any)=>x.nome?.toLowerCase()===name.toLowerCase()))resources.push({nome:name,status:'Recomendado',descricao:'Recomendação validada durante a Reunião Estratégica.',tipo:'Sob Demanda'});
 const indicators=lines(body.indicadores_sugeridos).map(nome=>({nome,meta:'A definir',responsavel:'A definir',periodicidade:'Mensal'}));
 const validation=body.validacoes_reuniao||{},problemValidation=validation.problema||{},priorityValidation=validation.prioridades||{},project=validation.projeto||{},crm=validation.crm||{},media=validation.midia||{},team=validation.equipe||{};
 const validatedSituation=[body.problema_principal,problemValidation.resposta&&`Validação do problema: ${problemValidation.resposta}.`,problemValidation.observacoes,project.resposta==='Sim'&&`Projeto em andamento: ${project.descricao||'confirmado'}.`,crm.resposta==='Sim'&&`CRM atual: ${crm.nome||'não informado'}. Uso: ${crm.uso||'não informado'}. Decisão: ${crm.futuro||'a definir'}.`,media.resposta==='Sim'&&`Campanhas pagas: ${media.canais||'canais não informados'}. Gestão: ${media.responsavel||'não informada'}. Verba aproximada: ${media.verba||'não informada'}.`,team.resposta==='Sim'&&`Equipe comercial: ${team.quantidade||'quantidade não informada'}. Funções: ${team.funcoes||'não informadas'}. Distribuição: ${team.distribuicao||'não informada'}.`].filter(Boolean).join('\n\n');
 const validatedPriorities=[body.prioridades_confirmadas,priorityValidation.resposta&&`Concordância do cliente: ${priorityValidation.resposta}.`,priorityValidation.alteracoes].filter(Boolean).join('\n');
 const existingTools={...(currentImplementation?.recursos_existentes||{}),CRM:crm.resposta==='Sim'?[crm.nome,crm.uso,crm.futuro].filter(Boolean).join(' — '):crm.resposta||'',Campanhas:media.resposta==='Sim'?[media.canais,media.responsavel,media.verba,media.resultados].filter(Boolean).join(' — '):media.resposta||'',Equipe_Comercial:team.resposta==='Sim'?[team.quantidade,team.funcoes,team.distribuicao,team.acompanhamento].filter(Boolean).join(' — '):team.resposta||'',Projeto_Em_Andamento:project.resposta==='Sim'?project.descricao:project.resposta||''};
 await Promise.all([
  api(`reunioes_estrategicas?id=eq.${body.reuniao_id}`,{method:'PATCH',body:JSON.stringify({status:'Realizada',etapa_atual:'Reunião concluída',prontidao_percentual:100,preparacao_id:preparation?.id,realizada_em:now,observacoes:body.observacoes_consultor||null,consultor:body.responsavel_reuniao,updated_at:now})}),
  api(`planos_estrategicos?diagnostico_id=eq.${body.diagnostico_id}`,{method:'PATCH',body:JSON.stringify({status:'Em Consolidação',situacao_atual:validatedSituation,objetivos:body.missao_definida,prioridades:validatedPriorities,proximos_passos:[...approved,...added].join('\n'),parecer_consultor:body.parecer_consultor||null,updated_at:now})}),
  currentImplementation?api(`planos_implantacao?id=eq.${currentImplementation.id}`,{method:'PATCH',body:JSON.stringify({objetivo:body.missao_definida,missoes:[{titulo:'Missão validada na Reunião Estratégica',objetivo:body.missao_definida,status:'Planejada'}],recursos:resources.length?resources:currentImplementation.recursos,recursos_existentes:existingTools,indicadores:indicators.length?indicators:currentImplementation.indicadores,observacoes:body.informacoes_complementares||currentImplementation.observacoes,updated_at:now})}):Promise.resolve(null),
  api('reuniao_estrategica_historico',{method:'POST',body:JSON.stringify({empresa_id:body.empresa_id,diagnostico_id:body.diagnostico_id,reuniao_id:body.reuniao_id,preparacao_id:preparation?.id,acao:'Reunião concluída',responsavel:body.responsavel_reuniao,status:'Concluída',snapshot:{...body,concluida_em:now}})})
 ]);
 await advanceJourney({diagnosticoId:body.diagnostico_id,empresaId:body.empresa_id,status:'Reunião Realizada',title:'Reunião Estratégica concluída',description:'Validações registradas. O Plano Estratégico está disponível para atualização.'});
 return Response.json({ok:true});
}

