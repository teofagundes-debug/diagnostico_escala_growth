import {access,isMaster} from '../../../lib/access';
import {advanceJourney} from '../../../lib/workflow';

const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({apikey:KEY!,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'});
const allowed=['empresa_id','diagnostico_id','reuniao_id','hipotese_inicial','recomendacoes','prontidao','pontos_validacao','perguntas_especificas','validacoes_reuniao','parecer_reuniao','problema_principal','ajustes_diagnostico','prioridades_confirmadas','recomendacoes_aprovadas','recomendacoes_removidas','novas_recomendacoes','informacoes_complementares','missao_definida','indicadores_sugeridos','observacoes_consultor','parecer_consultor','responsavel_reuniao','status','iniciada_em','concluida_em','ultima_alteracao_em','autosave_version'];
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
 const requestUrl=new globalThis.URL(req.url);if(requestUrl.searchParams.get('list')==='1'){const response=await api('preparacoes_reuniao?select=*&order=updated_at.desc');return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'application/json; charset=utf-8'}})}
 const id=requestUrl.searchParams.get('id'),meetingId=requestUrl.searchParams.get('meeting_id');
 const diagnostics=await api(`diagnosticos?id=eq.${id}&select=empresa_id&limit=1`).then(r=>r.ok?r.json():[]);
 const meeting=meetingId?await api(`reunioes_estrategicas?id=eq.${encodeURIComponent(meetingId)}&select=*&limit=1`).then(r=>r.ok?r.json():[]).then(x=>x[0]||null):await findMeeting(String(id||''),diagnostics[0]?.empresa_id);
 if(!meeting)return Response.json({error:'Reunião Estratégica não encontrada.'},{status:404});
 const [legacy,diagnosticLegacy,history]=await Promise.all([
  api(`preparacoes_reuniao?reuniao_id=eq.${encodeURIComponent(meeting.id)}&select=*&order=updated_at.desc&limit=1`).then(r=>r.ok?r.json():[]),
  api(`preparacoes_reuniao?diagnostico_id=eq.${encodeURIComponent(meeting.diagnostico_id)}&empresa_id=eq.${encodeURIComponent(meeting.empresa_id)}&select=*&order=updated_at.desc&limit=2`).then(r=>r.ok?r.json():[]),
  api(`reuniao_estrategica_historico?reuniao_id=eq.${encodeURIComponent(meeting.id)}&select=snapshot&order=created_at.desc&limit=20`).then(r=>r.ok?r.json():[])
 ]);
 const safeLegacy=legacy[0]||(diagnosticLegacy.length===1?diagnosticLegacy[0]:null);
 const meetingData={...(safeLegacy||{}),...(meeting.dados_reuniao||{})};
 const filled=(...values:any[])=>values.find(value=>typeof value==='string'&&value.trim().length>0)||'';
 const historyValue=(key:string)=>history.map((item:any)=>item.snapshot?.[key]).find((value:any)=>typeof value==='string'&&value.trim().length>0);
 const hypothesis=filled(meeting.consultant_initial_hypothesis,meetingData.hipotese_inicial,safeLegacy?.hipotese_inicial,historyValue('hipotese_inicial'));
 const questions=filled(meeting.prepared_specific_questions,meetingData.perguntas_especificas,safeLegacy?.perguntas_especificas,historyValue('perguntas_especificas'));
 const notes=filled(meeting.consultant_notes,meetingData.observacoes_consultor,safeLegacy?.observacoes_consultor,historyValue('observacoes_consultor'));
 const repair:any={};
 if(!String(meeting.consultant_initial_hypothesis||'').trim()&&hypothesis)repair.consultant_initial_hypothesis=hypothesis;
 if(!String(meeting.prepared_specific_questions||'').trim()&&questions)repair.prepared_specific_questions=questions;
 if(!String(meeting.consultant_notes||'').trim()&&notes)repair.consultant_notes=notes;
 if(Object.keys(repair).length)await api(`reunioes_estrategicas?id=eq.${meeting.id}`,{method:'PATCH',body:JSON.stringify({...repair,dados_reuniao:{...meetingData,hipotese_inicial:hypothesis,perguntas_especificas:questions,observacoes_consultor:notes},updated_at:new Date().toISOString()})});
 return Response.json({...meetingData,hipotese_inicial:hypothesis,perguntas_especificas:questions,observacoes_consultor:notes,autosave_version:Number(meeting.autosave_version||0),empresa_id:meeting.empresa_id,diagnostico_id:meeting.diagnostico_id,reuniao_id:meeting.id,meeting});
}

export async function POST(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const current=await access(req),raw=await req.json(),body=clean(raw),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id)return Response.json({error:'Empresa e diagnóstico são obrigatórios.'},{status:400});
 const meeting=body.reuniao_id?await api(`reunioes_estrategicas?id=eq.${encodeURIComponent(body.reuniao_id)}&select=*&limit=1`).then(r=>r.ok?r.json():[]).then(x=>x[0]||null):await findMeeting(body.diagnostico_id,body.empresa_id);
 if(!meeting?.id)return Response.json({error:'Nenhuma Reunião Estratégica agendada foi encontrada para esta empresa.'},{status:409});
 const meetingData={...(meeting.dados_reuniao||{}),...body,reuniao_id:meeting.id,responsavel_reuniao:body.responsavel_reuniao||current?.email||'Usuário Master',ultima_alteracao_em:now};
 const requestedVersion=raw.autosave_version!==undefined?Number(raw.autosave_version):Number(meeting.autosave_version||0)+1;
 const update:any={dados_reuniao:meetingData,autosave_version:requestedVersion,consultor:meetingData.responsavel_reuniao,observacoes:meetingData.observacoes_consultor||null,updated_at:now};
 if(Object.prototype.hasOwnProperty.call(raw,'hipotese_inicial'))update.consultant_initial_hypothesis=body.hipotese_inicial;
 if(Object.prototype.hasOwnProperty.call(raw,'perguntas_especificas'))update.prepared_specific_questions=body.perguntas_especificas;
 if(Object.prototype.hasOwnProperty.call(raw,'observacoes_consultor'))update.consultant_notes=body.observacoes_consultor;
 const saved=await api(`reunioes_estrategicas?id=eq.${meeting.id}&autosave_version=lt.${requestedVersion}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(update)});
 if(!saved.ok)return Response.json({error:'Não foi possível salvar a reunião. Execute a migração V28 no Supabase.'},{status:saved.status});
 const updated=(await saved.json())[0];
 if(!updated){const latest=await api(`reunioes_estrategicas?id=eq.${meeting.id}&select=autosave_version&limit=1`).then(r=>r.ok?r.json():[]);return Response.json({error:'Uma versão mais recente desta reunião já foi salva.',current_version:Number(latest[0]?.autosave_version||meeting.autosave_version||0)},{status:409});}
 if(!updated||('consultant_initial_hypothesis'in update&&updated.consultant_initial_hypothesis!==update.consultant_initial_hypothesis)||('prepared_specific_questions'in update&&updated.prepared_specific_questions!==update.prepared_specific_questions))return Response.json({error:'O banco não confirmou a persistência dos campos internos.'},{status:500});
 if(raw.autosave!==true)await api('reuniao_estrategica_historico',{method:'POST',body:JSON.stringify({empresa_id:body.empresa_id,diagnostico_id:body.diagnostico_id,reuniao_id:meeting.id,acao:'Reunião salva',responsavel:meetingData.responsavel_reuniao,status:meeting.status||'Agendada',snapshot:meetingData})});
 return Response.json({ok:true,message:'Reunião salva com sucesso.',id:updated.id,updated_at:updated.updated_at,autosave_version:updated.autosave_version,fields:updated.dados_reuniao,meetingData,meeting:updated});
}

export async function PATCH(req:Request){
 if(!await guard(req))return Response.json({error:'Não autorizado'},{status:401});
 const current=await access(req),raw=await req.json(),body=clean(raw),now=new Date().toISOString();
 if(!body.diagnostico_id||!body.empresa_id)return Response.json({error:'Empresa e diagnóstico são obrigatórios.'},{status:400});
 if(!body.reuniao_id)body.reuniao_id=(await findMeeting(body.diagnostico_id,body.empresa_id))?.id;
 if(!body.reuniao_id)return Response.json({error:'Reunião não vinculada. Confirme o agendamento na Agenda.'},{status:400});
 const meetingValidation=body.validacoes_reuniao||{},conclusion=meetingValidation.conclusao||{},requiredConclusion=['desafio','oportunidade_principal','prioridade_90_dias','restricoes','resumo_executivo'];
 if(requiredConclusion.some(key=>!String(conclusion[key]||'').trim()))return Response.json({error:'Preencha todos os campos obrigatórios da Conclusão da Reunião Estratégica antes de concluir.'},{status:400});
 body.responsavel_reuniao=body.responsavel_reuniao||current?.email||'Usuário Master';body.ultima_alteracao_em=now;
 const meetingData={...body,status:'Concluída',concluida_em:now,responsavel_reuniao:body.responsavel_reuniao||current?.email||'Usuário Master',ultima_alteracao_em:now};
 const implementation=await api(`planos_implantacao?diagnostico_id=eq.${body.diagnostico_id}&select=*&limit=1`).then(r=>r.ok?r.json():[]);
 const currentImplementation=implementation[0],lines=(value:any)=>String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const recommendationValidation=meetingValidation.recomendacoes||{},confirmedRecommendations=Object.entries(recommendationValidation).filter(([,value]:any)=>value?.status==='Confirmada').map(([name])=>name),legacyDecisions=Array.isArray(meetingValidation.decisoes?.selecionadas)?meetingValidation.decisoes.selecionadas.filter((name:string)=>name!=='Outro'):[],decisionMap:any={'Implantar CRM':'CRM Comercial','Automatizar WhatsApp':'WhatsApp Oficial','Implantar Google Ads':'Gestão Google Ads','Implantar Meta Ads':'Gestão Meta Ads'};
 const approved=(confirmedRecommendations.length?confirmedRecommendations:legacyDecisions).map((name:string)=>decisionMap[name]||name),added=confirmedRecommendations.length?[]:(meetingValidation.decisoes?.selecionadas||[]).includes('Outro')?lines(meetingValidation.decisoes?.outro):[],existingResources=Array.isArray(currentImplementation?.recursos)?currentImplementation.recursos:[];
 const resources=existingResources.map((item:any)=>approved.some((x:string)=>item.nome?.toLowerCase()===x.toLowerCase())?{...item,status:'Recomendado'}:item);
 for(const name of [...approved,...added])if(!resources.some((x:any)=>x.nome?.toLowerCase()===name.toLowerCase()))resources.push({nome:name,status:'Recomendado',descricao:'Recomendação originada no diagnóstico e confirmada durante a Reunião Estratégica.',tipo:'Sob Demanda'});
 const indicators=lines(body.indicadores_sugeridos).map(nome=>({nome,meta:'A definir',responsavel:'A definir',periodicidade:'Mensal'}));
 const reality=meetingValidation.realidade||{},opportunities=meetingValidation.oportunidades||{},questionAnswers=Object.values(meetingValidation.respostas_perguntas||{}).filter((value:any)=>String(value||'').trim()),recommendationNotes=Object.entries(recommendationValidation).filter(([,value]:any)=>value?.status).map(([name,value]:any)=>`${name}: ${value.status}${value.observacoes?` — ${value.observacoes}`:''}`);
 const validatedSituation=[conclusion.resumo_executivo,reality.confirmada&&`Realidade identificada no diagnóstico: ${reality.confirmada}.`,reality.novas_informacoes&&`Novas informações:\n${reality.novas_informacoes}`,reality.ajustes&&`Ajustes validados:\n${reality.ajustes}`,reality.observacoes,meetingValidation.hipotese_resposta&&`Validação da hipótese do consultor:\n${meetingValidation.hipotese_resposta}`,questionAnswers.length&&`Respostas às perguntas preparadas:\n${questionAnswers.join('\n')}`,conclusion.desafio&&`Principal desafio:\n${conclusion.desafio}`,conclusion.restricoes&&`Restrições identificadas:\n${conclusion.restricoes}`].filter(Boolean).join('\n\n');
 const validatedPriorities=[`Prioridade para os próximos 90 dias:\n${conclusion.prioridade_90_dias}`,meetingValidation.prioridade_validada&&`Prioridade validada com o cliente:\n${meetingValidation.prioridade_validada}`,conclusion.oportunidade_principal&&`Principal oportunidade:\n${conclusion.oportunidade_principal}`,opportunities.confirmada&&`Oportunidade confirmada:\n${opportunities.confirmada}`,opportunities.nova&&`Nova oportunidade:\n${opportunities.nova}`,opportunities.observacoes].filter(Boolean).join('\n\n');
 const traceableRecommendations=[...approved,...added].map((name:string)=>`Diagnóstico → Validação em reunião → ${name}`);
 const existingTools={...(currentImplementation?.recursos_existentes||{}),CRM:crm.resposta==='Sim'?[crm.nome,crm.uso,crm.futuro].filter(Boolean).join(' — '):crm.resposta||'',Campanhas:media.resposta==='Sim'?[media.canais,media.responsavel,media.verba,media.resultados].filter(Boolean).join(' — '):media.resposta||'',Equipe_Comercial:team.resposta==='Sim'?[team.quantidade,team.funcoes,team.distribuicao,team.acompanhamento].filter(Boolean).join(' — '):team.resposta||'',Projeto_Em_Andamento:project.resposta==='Sim'?project.descricao:project.resposta||''};
 await Promise.all([
  api(`reunioes_estrategicas?id=eq.${body.reuniao_id}`,{method:'PATCH',body:JSON.stringify({status:'Realizada',etapa_atual:'Reunião concluída',prontidao_percentual:100,dados_reuniao:meetingData,consultant_initial_hypothesis:body.hipotese_inicial??null,prepared_specific_questions:body.perguntas_especificas??null,consultant_notes:body.observacoes_consultor??null,realizada_em:now,observacoes:body.observacoes_consultor||null,consultor:body.responsavel_reuniao,updated_at:now})}),
  api(`planos_estrategicos?diagnostico_id=eq.${body.diagnostico_id}`,{method:'PATCH',body:JSON.stringify({status:'Em Consolidação',resumo:conclusion.resumo_executivo,situacao_atual:validatedSituation,objetivos:conclusion.prioridade_90_dias,prioridades:validatedPriorities,proximos_passos:traceableRecommendations.join('\n'),parecer_consultor:body.parecer_consultor||null,updated_at:now})}),
  currentImplementation?api(`planos_implantacao?id=eq.${currentImplementation.id}`,{method:'PATCH',body:JSON.stringify({objetivo:conclusion.prioridade_90_dias,missoes:[{titulo:'Prioridade dos próximos 90 dias',objetivo:conclusion.prioridade_90_dias,status:'Planejada'}],recursos:resources.length?resources:currentImplementation.recursos,recursos_existentes:existingTools,indicadores:indicators.length?indicators:currentImplementation.indicadores,observacoes:body.informacoes_complementares||currentImplementation.observacoes,updated_at:now})}):Promise.resolve(null),
  api('reuniao_estrategica_historico',{method:'POST',body:JSON.stringify({empresa_id:body.empresa_id,diagnostico_id:body.diagnostico_id,reuniao_id:body.reuniao_id,acao:'Reunião concluída',responsavel:body.responsavel_reuniao,status:'Concluída',snapshot:{...body,concluida_em:now}})})
 ]);
 await advanceJourney({diagnosticoId:body.diagnostico_id,empresaId:body.empresa_id,status:'Reunião Realizada',title:'Reunião Estratégica concluída',description:'Validações registradas. O Plano Estratégico está disponível para atualização.'});
 return Response.json({ok:true});
}

