'use client';
import {useEffect,useState} from 'react';
type OpenAnswer={id?:string;pergunta?:string|null;resposta?:string|null};
type PreparationData={resumo?:string|null;situacao_atual?:string|null;objetivos?:string|null;riscos?:string|null;observacoes?:string|null};

export function DiagnosticClientVoice({diagnosticId,answers,preparation}:{diagnosticId:string;answers:OpenAnswer[];preparation?:PreparationData}){
 const visible=answers.filter(item=>String(item.pergunta||'').trim()||String(item.resposta||'').trim());
 const [notes,setNotes]=useState(''),[noteState,setNoteState]=useState('Carregando anotações...');
 useEffect(()=>{fetch(`/api/diagnostic-notes?diagnostico_id=${encodeURIComponent(diagnosticId)}`,{cache:'no-store'}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error);setNotes(body.conteudo||'');setNoteState('')}).catch(error=>setNoteState(error instanceof Error?error.message:'Não foi possível carregar as anotações.'))},[diagnosticId]);
 const saveNotes=async()=>{setNoteState('Salvando...');const response=await fetch('/api/diagnostic-notes',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({diagnostico_id:diagnosticId,conteudo:notes})}),body=await response.json().catch(()=>({}));setNoteState(response.ok?'Anotações salvas com sucesso.':body.error||'Não foi possível salvar as anotações.')};
 const fields=[
  ['Resumo Executivo',preparation?.resumo],
  ['Principais dores identificadas',preparation?.situacao_atual],
  ['Objetivos declarados pelo cliente',preparation?.objetivos],
  ['Pontos que merecem investiga\u00e7\u00e3o',preparation?.riscos],
  ['Observa\u00e7\u00f5es do consultor',preparation?.observacoes]
 ] as const;
 return <>
  <section className="admin-section client-voice-section" aria-labelledby="client-voice-title"><span className="eyebrow">Leitura integral do diagn&#243;stico</span><h2 id="client-voice-title">VOZ DO CLIENTE</h2>{visible.length?<div className="client-voice-list">{visible.map((item,index)=><article key={item.id||`${item.pergunta}-${index}`}><h3>{item.pergunta||'Pergunta aberta'}</h3><blockquote>{item.resposta||''}</blockquote></article>)}</div>:<p>Nenhuma resposta aberta foi registrada neste diagn&#243;stico.</p>}</section>
  <section className="admin-section diagnostic-preparation" aria-labelledby="diagnostic-preparation-title"><span className="eyebrow">Uso interno do consultor</span><h2 id="diagnostic-preparation-title">PREPARA&#199;&#195;O DA REUNI&#195;O</h2><div className="diagnostic-preparation-grid">{fields.map(([label,value])=><article key={label}><h3>{label}</h3><p>{value||'A preencher durante a prepara\u00e7\u00e3o da reuni\u00e3o.'}</p></article>)}</div></section>
  <section className="admin-section consultant-diagnostic-notes no-print" aria-labelledby="consultant-notes-title"><span className="eyebrow">Conteúdo restrito à equipe</span><h2 id="consultant-notes-title">ANOTA&#199;&#213;ES DO CONSULTOR</h2><p>Registre informações internas antes, durante ou após a reunião. Este conteúdo nunca é enviado ao cliente.</p><textarea rows={9} value={notes} onChange={event=>setNotes(event.target.value)} placeholder="Pontos de atenção, objeções, oportunidades, decisões, próximos passos e riscos do projeto..."/><div className="detail-actions"><button className="btn btn-primary" onClick={saveNotes}>Salvar anotações</button>{noteState&&<span role="status">{noteState}</span>}</div></section>
 </>;
}
