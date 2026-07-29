type OpenAnswer={id?:string;pergunta?:string|null;resposta?:string|null};
type PreparationData={resumo?:string|null;situacao_atual?:string|null;objetivos?:string|null;riscos?:string|null;observacoes?:string|null};

export function DiagnosticClientVoice({answers,preparation}:{answers:OpenAnswer[];preparation?:PreparationData}){
 const visible=answers.filter(item=>String(item.pergunta||'').trim()||String(item.resposta||'').trim());
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
 </>;
}
