'use client';
import {useEffect,useState} from 'react';
const objectives:Record<string,string[]>={'Google Ads':['Captação de Leads','WhatsApp','Ligações','Tráfego para Site','Conversões','Vendas','Personalizado'],'Meta Ads':['Mensagens','Leads','Conversões','Reconhecimento de Marca','Catálogo','Tráfego','Personalizado']};
const serviceName:Record<string,string>={'Google Ads':'Gestão Google Ads','Meta Ads':'Gestão Meta Ads'};
export function MarketingParameters(){
 const [rows,setRows]=useState<any[]>([]),[services,setServices]=useState<any[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const load=async()=>{setLoading(true);setError('');try{const r=await fetch('/api/commercial',{cache:'no-store'}),text=await r.text(),x=text?JSON.parse(text):{};if(!r.ok)throw new Error(x.error||'Não foi possível carregar Marketing.');setRows(x.marketing||[]);setServices((x.resources||[]).filter((s:any)=>s.tipo==='Mensalidade'&&s.categoria==='Marketing'))}catch(e:any){setError(e?.message||'Não foi possível carregar Marketing.')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const edit=(i:number,key:string,value:any)=>setRows(rows.map((x,n)=>n===i?{...x,[key]:value}:x));
 const save=async()=>{setBusy(true);setError('');setMessage('');try{const r=await fetch('/api/commercial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'marketing',platforms:rows})}),x=await r.json();if(!r.ok)throw new Error(x.error);setMessage('Configurações operacionais de Marketing salvas com sucesso.');await load()}catch(e:any){setError(e?.message||'Não foi possível salvar Marketing.')}finally{setBusy(false)}};
 if(loading)return <div className="loading-state">Preparando Marketing...</div>;
 return <><section className="admin-section"><span className="eyebrow">Operação · acesso Master</span><h2>Marketing</h2><p>Este módulo reúne somente informações operacionais das campanhas. Serviços e valores comerciais são administrados exclusivamente no Catálogo Comercial.</p>{error&&<p className="error">{error}</p>}</section>
 <div className="marketing-platforms">{rows.map((p,i)=>{const linked=services.find((s:any)=>s.id===p.servico_id)||services.find((s:any)=>s.nome===serviceName[p.plataforma]);return <section className="admin-section" key={p.plataforma}><div className="module-toolbar"><div><span className="eyebrow">{p.plataforma}</span><h2>{linked?.nome||serviceName[p.plataforma]}</h2></div><span className={linked?'status-pill':'status-pill inactive'}>{linked?'Serviço vinculado':'Cadastre no Catálogo Comercial'}</span></div>
 <div className="marketing-main-fields">
  <label>Serviço vinculado<input value={linked?.nome||serviceName[p.plataforma]||''} readOnly/></label>
  <label>Objetivo da campanha<select value={p.objetivo_padrao||objectives[p.plataforma]?.[0]||'Personalizado'} onChange={e=>edit(i,'objetivo_padrao',e.target.value)}>{(objectives[p.plataforma]||['Personalizado']).map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Região de atuação<input value={p.regiao_atuacao||''} onChange={e=>edit(i,'regiao_atuacao',e.target.value)} placeholder="Local, regional ou nacional"/></label>
  <label>Público-alvo<textarea rows={3} value={p.publico_alvo||''} onChange={e=>edit(i,'publico_alvo',e.target.value)}/></label>
  <label>Verba recomendada<input type="number" min="0" step="0.01" value={p.verba_recomendada||''} onChange={e=>edit(i,'verba_recomendada',Number(e.target.value))}/><small className="field-help">Investimento do cliente diretamente na plataforma. Não compõe o faturamento da Escala Vendas.</small></label>
  <label>Verba aprovada pelo cliente<input type="number" min="0" step="0.01" value={p.verba_aprovada||''} onChange={e=>edit(i,'verba_aprovada',Number(e.target.value))}/></label>
  <label>URL da Landing Page<input type="url" value={p.landing_page_url||''} onChange={e=>edit(i,'landing_page_url',e.target.value)}/></label>
  {p.plataforma==='Google Ads'&&<label>Conta Google Ads<input value={p.conta_google_ads||''} onChange={e=>edit(i,'conta_google_ads',e.target.value)}/></label>}
  {p.plataforma==='Meta Ads'&&<label>Conta Meta Ads<input value={p.conta_meta_ads||''} onChange={e=>edit(i,'conta_meta_ads',e.target.value)}/></label>}
  <label>Status da campanha<select value={p.status_campanha||'Planejamento'} onChange={e=>edit(i,'status_campanha',e.target.value)}>{['Planejamento','Configuração','Ativa','Pausada','Encerrada'].map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Observações<textarea rows={4} value={p.observacoes_operacionais||''} onChange={e=>edit(i,'observacoes_operacionais',e.target.value)}/></label>
 </div></section>})}</div>
 <section className="admin-section method-note"><h3>Separação financeira</h3><p>A verba de mídia é paga diretamente pelo cliente às plataformas de anúncios. A mensalidade de Gestão Google Ads ou Gestão Meta Ads é definida exclusivamente no Catálogo Comercial.</p><button className="btn btn-primary" disabled={busy} onClick={save}>{busy?'Salvando...':'Salvar configurações de Marketing'}</button>{message&&<p className="success">{message}</p>}</section></>
}

