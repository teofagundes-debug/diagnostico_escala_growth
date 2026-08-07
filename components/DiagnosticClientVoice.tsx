type OpenAnswer={id?:string;pergunta?:string|null;resposta?:string|null};

export function DiagnosticClientVoice({answers}:{answers:OpenAnswer[];preparation?:unknown}){
 const visible=answers.filter(item=>String(item.pergunta||'').trim()||String(item.resposta||'').trim());
 return <section className="admin-section client-voice-section" aria-labelledby="client-voice-title"><span className="eyebrow">Leitura integral do diagn&#243;stico</span><h2 id="client-voice-title">VOZ DO CLIENTE</h2>{visible.length?<div className="client-voice-list">{visible.map((item,index)=><article key={item.id||`${item.pergunta}-${index}`}><h3>{item.pergunta||'Pergunta aberta'}</h3><blockquote>{item.resposta||''}</blockquote></article>)}</div>:<p>Nenhuma resposta aberta foi registrada neste diagn&#243;stico.</p>}</section>;
}
