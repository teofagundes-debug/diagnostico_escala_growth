'use client';
import {useEffect,useState} from 'react';

const money=(value:any)=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

export function CommercialConsolidationPanel({companyId,onChange}:{companyId:string;onChange?:()=>void}){
 const[data,setData]=useState<any>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=async()=>{const response=await fetch(`/api/commercial-consolidation?empresa_id=${companyId}`,{cache:'no-store'}),payload=await response.json().catch(()=>({}));setData(response.ok?payload.consolidation:{error:payload.error})};
 useEffect(()=>{load()},[companyId]);
 if(!data)return <section className="admin-section"><p>Preparando Consolidação Comercial 3.0...</p></section>;
 if(data.error)return <section className="admin-section"><p className="error">{data.error}</p></section>;
 if(data.flow==='LEGACY')return null;
 const comparison=data.comparison||{},consistent=Object.values(comparison).every((item:any)=>item.ok),ready=['PRONTO','ATUALIZACAO_PENDENTE'].includes(data.status)&&consistent;
 const act=async(action:'consolidate'|'update')=>{setBusy(true);setMessage('');const response=await fetch(action==='consolidate'?'/api/commercial-consolidation':'/api/client-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action==='consolidate'?{empresa_id:companyId,project_id:data.project_id,usuario:'Usuário Master'}:{action:'update_publication',empresa_id:companyId,project_id:data.project_id,usuario:'Usuário Master'})}),payload=await response.json().catch(()=>({}));setBusy(false);setMessage(response.ok?payload.message:payload.error||'Não foi possível concluir a ação.');await load();if(response.ok)onChange?.()};
 const canConsolidate=data.project_status==='Rascunho';
 const status=data.update_pending?'ATUALIZAÇÃO PENDENTE':ready?(data.has_publication?'PUBLICADO / ATUALIZADO':'PRONTO PARA PUBLICAÇÃO'):data.status==='DESATUALIZADO'?'DESATUALIZADA':'DIVERGÊNCIAS ENCONTRADAS';
 return <section className="admin-section commercial-consolidation-panel">
  <span className="eyebrow">Fonte canônica da contratação</span><h2>CONSOLIDAÇÃO COMERCIAL 3.0</h2>
  <div className={`consolidation-status ${ready?'ready':'pending'}`}><small>Status</small><b>{status}</b></div>
  <div className="commercial-summary">
   <article><small>Implantação</small><b>Projeto: {money(comparison.implantation?.project)}</b><span>{data.has_publication?'Snapshot':'Financeiro'}: {money(comparison.implantation?.financial)}</span><strong>{comparison.implantation?.ok?'OK':'DIVERGENTE'}</strong></article>
   <article><small>Mensalidade</small><b>Projeto: {money(comparison.monthly?.project)}</b><span>{data.has_publication?'Snapshot':'Financeiro'}: {money(comparison.monthly?.financial)}</span><strong>{comparison.monthly?.ok?'OK':'DIVERGENTE'}</strong></article>
   <article><small>Recursos</small><b>Projeto: {comparison.resources?.project||0}</b><span>Snapshot: {comparison.resources?.snapshot||0}</span><strong>{comparison.resources?.ok?'OK':'DIVERGENTE'}</strong></article>
  </div>
  <p>A consolidação copia e congela os dados já aprovados no Projeto. Nenhum preço é recalculado.</p>
  <div className="detail-actions">
   {canConsolidate&&<button className="btn btn-primary" disabled={busy} onClick={()=>act('consolidate')}>{busy?'Processando...':'CONSOLIDAR COMERCIAL 3.0'}</button>}
   {data.update_pending&&<button className="btn btn-primary" disabled={busy||!ready} onClick={()=>act('update')}>Atualizar para o Cliente</button>}
  </div>
  {data.update_pending&&<p className="separation-note">A versão anteriormente publicada permanece no Portal até a confirmação desta atualização.</p>}
  {data.consolidated_at&&<small className="consolidation-audit">Última consolidação: {new Date(data.consolidated_at).toLocaleString('pt-BR')} · {data.consolidated_by}</small>}
  {message&&<p className={message.includes('concluída')||message.includes('atualizado')?'success':'error'}>{message}</p>}
 </section>;
}
