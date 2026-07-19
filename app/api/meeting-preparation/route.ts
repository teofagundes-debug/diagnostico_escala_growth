import {access,isMaster} from '../../../lib/access';
import {ensurePlan} from '../../../lib/workflow';

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
 const meetingValidation=body.validacoes_reuniao||{},conclusion=meetingValidation.conclusao||{};
 if(!String(conclusion.resumo_executivo||'').trim())return Response.json({error:'Revise e salve o Resumo Executivo antes de gerar o Plano Estratégico.'},{status:400});
 body.responsavel_reuniao=body.responsavel_reuniao||current?.email||'Usuário Master';body.ultima_alteracao_em=now;
 const meetingData={...body,status:'Concluída',concluida_em:now,responsavel_reuniao:body.responsavel_reuniao||current?.email||'Usuário Master',ultima_alteracao_em:now};
 const implementation=await api(`planos_implantacao?diagnostico_id=eq.${body.diagnostico_id}&select=*&limit=1`).then(r=>r.ok?r.json():[]);
 const currentImplementation=implementation[0],lines=(value:any)=>String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const recommendationValidation=meetingValidation.recomendacoes||{},confirmedRecommendations=Object.entries(recommendationValidation).filter(([,value]:any)=>value?.status==='Confirmada').map(([name])=>name),legacyDecisions=Array.isArray(meetingValidation.decisoes?.selecionadas)?meetingValidation.decisoes.selecionadas.filter((name:string)=>name!=='Outro'):[],decisionMap:any={'Implantar CRM':'CRM Comercial','Automatizar WhatsApp':'WhatsApp Oficial','Implantar Google Ads':'Gestão Google Ads','Implantar Meta Ads':'Gestão Meta Ads'};
 const approved=(confirmedRecommendations.length?confirmedRecommendations:legacyDecisions).map((name:string)=>decisionMap[name]||name),added=confirmedRecommendations.length?[]:(meetingValidation.decisoes?.selecionadas||[]).includes('Outro')?lines(meetingValidation.decisoes?.outro):[],existingResources=Array.isArray(currentImplementation?.recursos)?currentImplementation.recursos:[];
 const resources=existingResources.map((item:any)=>approved.some((x:string)=>item.nome?.toLowerCase()===x.toLowerCase())?{...item,status:'Recomendado',origem:'Diagnóstico → Validação em reunião'}:{...item,status:'Não recomendado'});
 for(const name of [...approved,...added])if(!resources.some((x:any)=>x.nome?.toLowerCase()===name.toLowerCase()))resources.push({nome:name,status:'Recomendado',descricao:'Recomendação originada no diagnóstico e confirmada durante a Reunião Estratégica.',tipo:'Sob Demanda',origem:'Diagnóstico → Validação em reunião'});
 const indicators=lines(body.indicadores_sugeridos).map(nome=>({nome,meta:'A definir',responsavel:'A definir',periodicidade:'Mensal'}));
 const reality=meetingValidation.realidade||{},opportunities=meetingValidation.oportunidades||{},priorityValidation=meetingValidation.prioridade||{},confirmedOpportunities=Array.isArray(opportunities.confirmadas)?opportunities.confirmadas.map((key:string)=>key.split(':').slice(2).join(':')).filter(Boolean):lines(opportunities.confirmada),validatedPriority=priorityValidation.selecionada==='Outra'?priorityValidation.outra:priorityValidation.selecionada||meetingValidation.prioridade_validada,questionAnswers=Object.values(meetingValidation.respostas_perguntas||{}).filter((value:any)=>String(value||'').trim());
 const validatedSituation=[conclusion.resumo_executivo,reality.confirmada&&`Realidade identificada no diagnóstico: ${reality.confirmada}.`,reality.novas_informacoes&&`Novas informações:\n${reality.novas_informacoes}`,reality.ajustes&&`Ajustes validados:\n${reality.ajustes}`,reality.observacoes,meetingValidation.hipotese_resposta&&`Validação da hipótese do consultor:\n${meetingValidation.hipotese_resposta}`,questionAnswers.length&&`Respostas às perguntas preparadas:\n${questionAnswers.join('\n')}`,conclusion.desafio&&`Principal desafio:\n${conclusion.desafio}`,conclusion.restricoes&&`Restrições identificadas:\n${conclusion.restricoes}`].filter(Boolean).join('\n\n');
 const validatedPriorities=[validatedPriority&&`Prioridade validada com o cliente:\n${validatedPriority}`,priorityValidation.observacoes&&`Observações sobre a prioridade:\n${priorityValidation.observacoes}`,conclusion.oportunidade_principal&&`Principal oportunidade:\n${conclusion.oportunidade_principal}`,confirmedOpportunities.length&&`Oportunidades confirmadas:\n${confirmedOpportunities.join('\n')}`,opportunities.nova&&`Nova oportunidade:\n${opportunities.nova}`,opportunities.observacoes].filter(Boolean).join('\n\n');
 const traceableRecommendations=[...approved,...added].map((name:string)=>`Diagnóstico → Validação em reunião → ${name}`);
 const legacyCrm=meetingValidation.crm||{},legacyMedia=meetingValidation.midia||{},legacyTeam=meetingValidation.equipe||{},legacyProject=meetingValidation.projeto||{};
 const existingTools={...(currentImplementation?.recursos_existentes||{}),CRM:legacyCrm.resposta==='Sim'?[legacyCrm.nome,legacyCrm.uso,legacyCrm.futuro].filter(Boolean).join(' — '):legacyCrm.resposta||'',Campanhas:legacyMedia.resposta==='Sim'?[legacyMedia.canais,legacyMedia.responsavel,legacyMedia.verba,legacyMedia.resultados].filter(Boolean).join(' — '):legacyMedia.resposta||'',Equipe_Comercial:legacyTeam.resposta==='Sim'?[legacyTeam.quantidade,legacyTeam.funcoes,legacyTeam.distribuicao,legacyTeam.acompanhamento].filter(Boolean).join(' — '):legacyTeam.resposta||'',Projeto_Em_Andamento:legacyProject.resposta==='Sim'?legacyProject.descricao:legacyProject.resposta||''};
 const steps:any[]=[{step:'salvar_reuniao',label:'Reunião salva',ok:true}],warnings:string[]=[];
 const success=(step:string,label:string)=>{steps.push({step,label,ok:true});console.info(`✓ ${label}`)};
 const failure=(step:string,label:string,error:any)=>{const detail=String(error?.message||error||'Erro desconhecido');steps.push({step,label,ok:false,error:detail});warnings.push(`${label}: ${detail}`);console.error(`✗ ${label}`,detail)};
 const runStep=async(step:string,label:string,operation:()=>Promise<any>)=>{try{const result=await operation();if(result instanceof Response&&!result.ok)throw new Error(await result.text()||`HTTP ${result.status}`);success(step,label);return result}catch(error){failure(step,label,error);return null}};
 let plan:any;
 try{plan=await ensurePlan(body.diagnostico_id,body.empresa_id);if(!plan?.id)throw new Error('O Plano Estratégico não retornou um identificador.');const response=await api(`planos_estrategicos?id=eq.${encodeURIComponent(plan.id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'Em Consolidação',resumo:conclusion.resumo_executivo,situacao_atual:validatedSituation,objetivos:validatedPriority||'Prioridade a consolidar',prioridades:validatedPriorities,proximos_passos:traceableRecommendations.join('\n'),parecer_consultor:body.parecer_consultor||null,updated_at:now})});if(!response.ok)throw new Error(await response.text()||`HTTP ${response.status}`);const updatedPlans=await response.json();if(!updatedPlans?.[0])throw new Error('O banco não confirmou a atualização do Plano Estratégico.');plan=updatedPlans[0];success('plano_estrategico','Plano Estratégico criado e atualizado')}catch(error){failure('plano_estrategico','Erro ao gerar Plano Estratégico',error);return Response.json({ok:false,error:'Não foi possível gerar o Plano Estratégico.',failed_step:'plano_estrategico',steps},{status:500})}
 await runStep('status_reuniao','Status da reunião atualizado',()=>api(`reunioes_estrategicas?id=eq.${encodeURIComponent(body.reuniao_id)}`,{method:'PATCH',body:JSON.stringify({status:'Realizada',etapa_atual:'Reunião concluída',prontidao_percentual:100,dados_reuniao:meetingData,consultant_initial_hypothesis:body.hipotese_inicial??null,prepared_specific_questions:body.perguntas_especificas??null,consultant_notes:body.observacoes_consultor??null,realizada_em:now,observacoes:body.observacoes_consultor||null,consultor:body.responsavel_reuniao,updated_at:now})}));
 if(currentImplementation)await runStep('plano_implantacao','Plano de Implantação atualizado',()=>api(`planos_implantacao?id=eq.${encodeURIComponent(currentImplementation.id)}`,{method:'PATCH',body:JSON.stringify({objetivo:validatedPriority||'Prioridade a consolidar',missoes:[{titulo:'Prioridade validada na Reunião Estratégica',objetivo:validatedPriority||'Prioridade a consolidar',status:'Planejada'}],recursos:resources.length?resources:currentImplementation.recursos,recursos_existentes:existingTools,indicadores:indicators.length?indicators:currentImplementation.indicadores,observacoes:body.informacoes_complementares||currentImplementation.observacoes,updated_at:now})}));
 await runStep('pipeline','Pipeline atualizado',()=>api(`diagnosticos?id=eq.${encodeURIComponent(body.diagnostico_id)}`,{method:'PATCH',body:JSON.stringify({status:'Reunião Realizada',updated_at:now})}));
 await runStep('historico_status','Histórico de status atualizado',()=>api('diagnostico_status_historico',{method:'POST',body:JSON.stringify({diagnostico_id:body.diagnostico_id,status:'Reunião Realizada'})}));
 await runStep('timeline','Timeline atualizada',()=>api('dossie_eventos',{method:'POST',body:JSON.stringify({empresa_id:body.empresa_id,diagnostico_id:body.diagnostico_id,tipo:'Jornada',titulo:'Reunião Estratégica concluída',descricao:'Resumo aprovado e Plano Estratégico gerado.',data_evento:now,concluido:true})}));
 await runStep('log_interno','Log interno da conclusão registrado',()=>api('reuniao_estrategica_historico',{method:'POST',body:JSON.stringify({empresa_id:body.empresa_id,diagnostico_id:body.diagnostico_id,reuniao_id:body.reuniao_id,acao:'Plano Estratégico gerado',responsavel:body.responsavel_reuniao,status:'Concluída',snapshot:{...body,concluida_em:now,plan_id:plan.id,steps,warnings}})}));
 return Response.json({ok:true,plan_id:plan.id,redirect_to:`/central/planos?diagnostico_id=${body.diagnostico_id}&plano_id=${plan.id}`,steps,warnings,message:warnings.length?'Plano Estratégico gerado. Algumas atualizações secundárias precisam de revisão.':'Plano Estratégico gerado com sucesso.'});
}

