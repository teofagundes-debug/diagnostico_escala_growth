'use client';
import {useEffect,useMemo,useState} from 'react';

const readinessItems=[
  ['diagnostico','Diagnóstico revisado'],['ieg','IEG analisado'],['gargalos','Principais gargalos identificados'],
  ['hipotese','Hipótese inicial registrada'],['recomendacoes','Recomendações automáticas revisadas'],['perguntas','Perguntas específicas preparadas']
];
const validationItems=[
  ['problema','O principal problema realmente é esse?'],['prioridades','O cliente concorda com as prioridades?'],
  ['projeto','Existe algum projeto em andamento?'],['crm','Já utiliza CRM?'],['midia','Utiliza campanhas pagas?'],['equipe','Possui equipe comercial?']
];
const recommendedNames=['CRM Comercial','Agente de IA','WhatsApp Oficial','Dashboard Executivo'];

export function MeetingPreparation({data,onComplete}:{data:any;onComplete:()=>void}){
 const [record,setRecord]=useState<any>({}),[readiness,setReadiness]=useState<any>({}),[checks,setChecks]=useState<any>({}),[validations,setValidations]=useState<any>({}),[mode,setMode]=useState<'prepare'|'conduct'>('prepare'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const meeting=record.meeting;
 const report=data.relatorio_snapshot||{};
 const recommendations=useMemo(()=>{const saved=Array.isArray(record.recomendacoes)?record.recomendacoes:[];if(saved.length)return saved;const resources=(data.planos_implantacao?.[0]?.recursos||[]).filter((x:any)=>['Recomendado','Contratado'].includes(x.status)).map((x:any)=>x.nome);return resources.length?resources:recommendedNames},[record.recomendacoes,data.planos_implantacao]);
 useEffect(()=>{fetch('/api/meeting-preparation?id='+data.id,{cache:'no-store'}).then(async r=>{const x=await r.json();if(r.ok){setRecord(x);setReadiness(x.prontidao||{});setChecks(x.pontos_validacao||{});setValidations(x.validacoes_reuniao||{})}})},[data.id]);
 const effective={...readiness,hipotese:Boolean(record.hipotese_inicial?.trim()),recomendacoes:Boolean(readiness.recomendacoes),perguntas:Boolean(record.perguntas_especificas?.trim())};
 const percent=Math.round(readinessItems.filter(([k])=>effective[k]).length/readinessItems.length*100);
 const level=percent<=40?['Preparação Básica','Ainda existem informações importantes para revisar.','basic']:percent<=80?['Preparação Adequada','A reunião pode ser realizada, porém ainda existem oportunidades de preparação.','adequate']:['Preparação Completa','O consultor está totalmente preparado para conduzir a reunião.','complete'];
 const save=async(status=mode==='conduct'?'Em condução':'Em preparação')=>{setBusy(true);setMessage('');const payload={...record,empresa_id:data.empresa_id,diagnostico_id:data.id,reuniao_id:meeting?.id,recomendacoes:recommendations,prontidao:effective,pontos_validacao:checks,validacoes_reuniao:validations,status};delete payload.meeting;const r=await fetch('/api/meeting-preparation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),x=await r.json();setBusy(false);setMessage(r.ok?'Preparação salva com sucesso.':x.error||'Não foi possível salvar.');if(r.ok)setRecord((v:any)=>({...v,...payload}))};
 const start=async()=>{await save('Em condução');setMode('conduct');window.scrollTo({top:0,behavior:'smooth'})};
 const conclude=async()=>{if(!meeting?.id){setMessage('Agende a Reunião Estratégica antes de concluí-la.');return}if(!confirm('Concluir a Reunião Estratégica e gerar a base oficial do Plano Estratégico?'))return;setBusy(true);const payload={...record,empresa_id:data.empresa_id,diagnostico_id:data.id,reuniao_id:meeting.id,recomendacoes:recommendations,prontidao:effective,pontos_validacao:checks,validacoes_reuniao:validations,status:'Concluída'};delete payload.meeting;const r=await fetch('/api/meeting-preparation',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});setBusy(false);if(r.ok){setMessage('Reunião concluída. O Plano Estratégico está disponível para atualização.');onComplete()}else setMessage('Não foi possível concluir a reunião. Tente novamente.')};
 const company=data.empresas||{},responsible=data.responsaveis||{};
 return <section className="meeting-preparation admin-section">
  <span className="eyebrow">Uso interno do consultor</span><h2>{mode==='prepare'?'Preparação da Reunião Estratégica':'Condução da Reunião Estratégica'}</h2>
  <div className={'readiness-card '+level[2]}><div><small>Prontidão da Reunião</small><b>{percent}%</b></div><div><strong>{level[0]}</strong><p>{level[1]}</p></div></div>
  {percent===100&&<p className="success">Preparação concluída. Você está pronto para conduzir a Reunião Estratégica.</p>}
  <div className="detail-metrics">{[['Empresa',company.nome],['Segmento',company.segmento||'Não informado'],['Responsável',responsible.nome||'Não informado'],['Cidade',company.cidade||'Não informada'],['Colaboradores',company.numero_colaboradores||company.colaboradores||'Não informado'],['Diagnóstico',new Date(data.data_diagnostico).toLocaleDateString('pt-BR')]].map(([a,b])=><div key={a}><small>{a}</small><b>{b}</b></div>)}</div>
  <div className="detail-grid"><div><h3>Resumo do Diagnóstico</h3><p><b>IEG Geral:</b> {data.pontuacao_geral}/100</p><p><b>Principal força:</b> {data.maior_pilar}</p><p><b>Principal gargalo:</b> {data.menor_pilar}</p><p>{data.parecer||report.parecer}</p></div><div><h3>Recomendações Automáticas</h3><p>Recomendações iniciais, ainda não são decisões finais.</p>{recommendations.map((x:string)=><p key={x}>✓ {x}</p>)}</div></div>
  <label><b>Hipótese inicial do consultor</b><span>O que acreditamos ser o principal problema desta empresa?</span><textarea rows={4} value={record.hipotese_inicial||''} onChange={e=>setRecord({...record,hipotese_inicial:e.target.value})}/></label>
  <h3>Prontidão da Reunião</h3><div className="check-grid">{readinessItems.map(([k,l])=><label key={k}><input type="checkbox" checked={Boolean(effective[k])} disabled={k==='hipotese'||k==='perguntas'} onChange={e=>setReadiness({...readiness,[k]:e.target.checked})}/>{l}</label>)}</div>
  <label><b>Perguntas específicas preparadas</b><textarea rows={3} value={record.perguntas_especificas||''} onChange={e=>setRecord({...record,perguntas_especificas:e.target.value})}/></label>
  <h3>Pontos para Validar</h3><div className="check-grid">{validationItems.map(([k,l])=><label key={k}><input type="checkbox" checked={Boolean(checks[k])} onChange={e=>setChecks({...checks,[k]:e.target.checked})}/>{l}</label>)}</div>
  {mode==='conduct'&&<div className="meeting-conduction"><h3>Validação com o cliente</h3><p>Valide, ajuste e priorize as conclusões do diagnóstico. Não repita perguntas já respondidas.</p>{validationItems.slice(0,3).map(([k,l])=><label key={k}>{l}<textarea rows={2} value={validations[k]||''} onChange={e=>setValidations({...validations,[k]:e.target.value})}/></label>)}<label>Parecer da Reunião<textarea rows={4} value={record.parecer_reuniao||''} onChange={e=>setRecord({...record,parecer_reuniao:e.target.value})}/></label></div>}
  <div className="detail-actions"><button className="btn btn-secondary" disabled={busy} onClick={()=>save()}>{busy?'Salvando...':'Salvar preparação'}</button>{mode==='prepare'?<button className="btn btn-primary" onClick={start}>Conduzir Reunião Estratégica</button>:<button className="btn btn-primary" disabled={busy} onClick={conclude}>Concluir Reunião Estratégica</button>}</div>{message&&<p className={message.startsWith('Não')||message.startsWith('Agende')?'error':'success'}>{message}</p>}
 </section>
}

