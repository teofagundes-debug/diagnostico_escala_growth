"use client";
import {useEffect,useState} from 'react';
const money=(v:any)=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const solutionDraftKey='escala-growth-solution-draft';
const legend=[[1,'Muito Baixo','Configuração simples.'],[2,'Baixo','Configuração padrão.'],[3,'Médio','Personalização moderada.'],[5,'Alto','Implantação estratégica.'],[8,'Muito Alto','Integrações complexas.'],[13,'Projeto Especial','Grande esforço de implantação.']];
function useCommercial(){const [data,setData]=useState<any>(null),[error,setError]=useState('');const load=async()=>{setError('');try{const r=await fetch('/api/commercial',{cache:'no-store'}),x=await r.json();if(!r.ok)throw new Error(x.error);setData(x)}catch(e:any){setError(e?.message||'Não foi possível carregar os parâmetros.')}};useEffect(()=>{load()},[]);return{data,error,load}}
export function CommercialParameters(){
 const {data,error,load}=useCommercial(),[editing,setEditing]=useState<any>(()=>{try{const saved=sessionStorage.getItem(solutionDraftKey);return saved?JSON.parse(saved):null}catch{return null}}),[message,setMessage]=useState(''),[formError,setFormError]=useState(''),[tab,setTab]=useState<'services'|'financial'>('services');
 useEffect(()=>{try{if(editing)sessionStorage.setItem(solutionDraftKey,JSON.stringify(editing));else sessionStorage.removeItem(solutionDraftKey)}catch{}},[editing]);
 if(error)return <section className="admin-section"><h2>Parâmetros Comerciais</h2><p className="error">{error}</p></section>;
 if(!data)return <div className="loading-state">Preparando parâmetros comerciais...</div>;
 const p=data.parameters||{valor_ui:350,desconto_pix:10,prazo_contratual:12,validade_proposta:15,reajuste_indice:'IPCA',reajuste_periodicidade:12,reajuste_mes_base:1};
 const saveParams=async(e:any)=>{e.preventDefault();setFormError('');const body=Object.fromEntries(new FormData(e.currentTarget));const r=await fetch('/api/commercial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'parameters',...body})}),x=await r.json();if(!r.ok){setFormError(x.error);return}setMessage('Configurações financeiras salvas com sucesso.');load()};
 const saveResource=async()=>{setFormError('');const r=await fetch('/api/commercial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'resource',...editing})}),x=await r.json();if(!r.ok){setFormError(x.error);return}setEditing(null);setMessage('Produto/serviço salvo com sucesso.');load()};
 const remove=async(id:string)=>{if(confirm('Arquivar este solução?')){await fetch('/api/commercial?id='+id,{method:'DELETE'});load()}};
 const newResource=()=>setEditing({codigo:'',categoria:'',nome:'',descricao:'',beneficios:[],objetivo_padrao:'',entregas_padrao:[],recursos_envolvidos:[],pre_requisitos:'',criterio_conclusao:'',ordem_implantacao:'',semana_sugerida:'Semana 1',duracao_padrao:7,dependencias:'',descricao_tecnica:'',tipo:'Implantação',ui:1,valor_mensal:'',valor_avulso:'',obrigatoriedade:'Padrão',responsavel:'Escala Vendas',prioridade:'Média',observacoes:'',ativo:true});
 return <><div className="admin-section catalog-tabs"><button className={tab==='services'?'active':''} onClick={()=>setTab('services')}>Serviços</button><button className={tab==='financial'?'active':''} onClick={()=>setTab('financial')}>Configurações Financeiras</button></div>{tab==='financial'&&<section className="admin-section"><span className="eyebrow">Administração · acesso Master</span><h2>Configurações Financeiras</h2><p>Fonte única das regras comerciais utilizadas em implantação, proposta, mensalidades e contrato.</p><form className="parameter-form" onSubmit={saveParams}>
  <label>Valor da UI<input name="valor_ui" type="number" min="0.01" step="0.01" defaultValue={p.valor_ui}/></label>
  <label>Desconto para pagamento da Implantação via PIX (%)<input name="desconto_pix" type="number" min="0" max="100" step="0.01" defaultValue={p.desconto_pix}/></label>
  <label>Prazo Contratual (meses)<input name="prazo_contratual" type="number" min="1" defaultValue={p.prazo_contratual}/></label>
  <label>Validade da Proposta (dias)<input name="validade_proposta" type="number" min="1" defaultValue={p.validade_proposta}/></label>
  <label>Índice de reajuste<select name="reajuste_indice" defaultValue={p.reajuste_indice||'IPCA'}><option>IPCA</option><option>IGP-M</option></select></label>
  <label>Periodicidade<select name="reajuste_periodicidade" defaultValue={p.reajuste_periodicidade||12}><option value="12">12 meses</option></select></label>
  <label>Mês-base do reajuste<select name="reajuste_mes_base" defaultValue={p.reajuste_mes_base||1}>{months.map((m,i)=><option value={i+1} key={m}>{m}</option>)}</select></label>
  <label>Multa por atraso (%)<input name="multa_atraso" type="number" min="0" step="0.01" defaultValue={p.multa_atraso??''} placeholder="Opcional"/></label>
  <label>Juros por atraso (% ao mês)<input name="juros_atraso" type="number" min="0" step="0.01" defaultValue={p.juros_atraso??''} placeholder="Opcional"/></label>
  <label>Dias de tolerância<input name="dias_tolerancia" type="number" min="0" defaultValue={p.dias_tolerancia??''} placeholder="Opcional"/></label>
  <button className="btn btn-primary">Salvar configurações financeiras</button>
 </form>{message&&<p className="success">{message}</p>}{formError&&<p className="error">{formError}</p>}</section>}
 {tab==='services'&&<><section className="admin-section"><div className="module-toolbar"><div><span className="eyebrow">Base de conhecimento</span><h2>Biblioteca de Soluções Escala Growth</h2></div><button className="btn btn-primary" onClick={newResource}>Nova solução</button></div>
 <div className="resource-admin-list">{data.resources.map((x:any)=><article key={x.id} className={!x.ativo?'inactive':''}><b>{x.codigo}</b><span>{x.tipo}</span><strong>{x.nome}</strong><span>{x.tipo==='Implantação'?x.ui+' UI':money(x.tipo==='Mensalidade'?x.valor_mensal:x.valor_avulso)}</span><span className={'service-class '+(x.obrigatoriedade||'Padrão').toLowerCase().replace(' ','-')}>{x.obrigatoriedade==='Obrigatório'?'🔒 Obrigatório':x.obrigatoriedade==='Sob Demanda'?'＋ Sob Demanda':'✓ Padrão'}</span><span>{x.responsavel}</span><button onClick={()=>setEditing(x)}>Editar</button><button onClick={()=>remove(x.id)}>Arquivar</button></article>)}</div></section>
 <section className="admin-section ui-legend"><span className="eyebrow">Ajuda interna</span><h2>Legenda Oficial da UI</h2><p>A UI é exclusiva dos serviços de Implantação e representa esforço relativo, nunca horas, custo ou preço final.</p><div>{legend.map(([ui,title,text])=><article key={ui}><b>{ui} UI</b><strong>{title}</strong><span>{text}</span></article>)}</div></section></>}
 {editing&&<div className="modal"><section><h2>{editing.id?'Editar':'Novo'} solução</h2><div className="solution-template-form">
  <fieldset><legend>1 · Comercial</legend><div className="resource-form">
   <label>Código<input value={editing.codigo||''} onChange={e=>setEditing({...editing,codigo:e.target.value})}/></label>
   <label>Nome da solução<input value={editing.nome||''} onChange={e=>setEditing({...editing,nome:e.target.value})}/></label>
   <label>Categoria<input value={editing.categoria||''} onChange={e=>setEditing({...editing,categoria:e.target.value})}/></label>
   <label>Prioridade comercial<input value={editing.prioridade||''} onChange={e=>setEditing({...editing,prioridade:e.target.value})}/></label>
   <label className="wide">Descrição Comercial<textarea rows={4} value={editing.descricao||''} onChange={e=>setEditing({...editing,descricao:e.target.value})}/></label>
   <label className="wide">Benefícios <small className="field-help">Um benefício por linha.</small><textarea rows={4} value={Array.isArray(editing.beneficios)?editing.beneficios.join('\n'):editing.beneficios||''} onChange={e=>setEditing({...editing,beneficios:e.target.value})}/></label>
   <label>Tipo<select value={editing.tipo||'Implantação'} onChange={e=>setEditing({...editing,tipo:e.target.value,ui:e.target.value==='Implantação'?(editing.ui||1):null,valor_mensal:e.target.value==='Mensalidade'?(editing.valor_mensal??''):null,valor_avulso:e.target.value==='Avulso'?(editing.valor_avulso??''):null})}><option>Implantação</option><option>Mensalidade</option><option>Avulso</option></select></label>
   {editing.tipo==='Implantação'&&<label>UI (Unidade de Implantação)<input type="number" min="0.01" step="0.01" value={editing.ui??''} onChange={e=>setEditing({...editing,ui:e.target.value})}/></label>}
   {editing.tipo==='Mensalidade'&&<label>Valor Mensal<input type="number" min="0" step="0.01" value={editing.valor_mensal??''} onChange={e=>setEditing({...editing,valor_mensal:e.target.value})}/></label>}
   {editing.tipo==='Avulso'&&<label>Valor Avulso<input type="number" min="0" step="0.01" value={editing.valor_avulso??''} onChange={e=>setEditing({...editing,valor_avulso:e.target.value})}/></label>}
   <label>Comportamento no Projeto<select value={editing.obrigatoriedade||'Padrão'} onChange={e=>setEditing({...editing,obrigatoriedade:e.target.value})}><option>Obrigatório</option><option>Padrão</option><option>Sob Demanda</option></select></label>
   <label>Status<select value={editing.ativo===false?'Inativo':'Ativo'} onChange={e=>setEditing({...editing,ativo:e.target.value==='Ativo'})}><option>Ativo</option><option>Inativo</option></select></label>
  </div></fieldset>
  <fieldset><legend>2 · Implantação</legend><div className="resource-form">
   <label className="wide">Objetivo padrão<textarea rows={5} value={editing.objetivo_padrao||''} onChange={e=>setEditing({...editing,objetivo_padrao:e.target.value})}/></label>
   <label>Entregas padrão <small className="field-help">Uma entrega por linha.</small><textarea rows={6} value={Array.isArray(editing.entregas_padrao)?editing.entregas_padrao.join('\n'):editing.entregas_padrao||''} onChange={e=>setEditing({...editing,entregas_padrao:e.target.value})}/></label>
   <label>Recursos envolvidos <small className="field-help">Um recurso por linha.</small><textarea rows={6} value={Array.isArray(editing.recursos_envolvidos)?editing.recursos_envolvidos.join('\n'):editing.recursos_envolvidos||''} onChange={e=>setEditing({...editing,recursos_envolvidos:e.target.value})}/></label>
   <label>Pré-requisitos<textarea rows={4} value={editing.pre_requisitos||''} onChange={e=>setEditing({...editing,pre_requisitos:e.target.value})}/></label>
   <label>Critério de conclusão<textarea rows={4} value={editing.criterio_conclusao||''} onChange={e=>setEditing({...editing,criterio_conclusao:e.target.value})}/></label>
  </div></fieldset>
  <fieldset><legend>3 · Planejamento</legend><div className="resource-form planning-fields">
   <label>Ordem de implantação<input type="number" min="1" step="1" value={editing.ordem_implantacao??''} onChange={e=>setEditing({...editing,ordem_implantacao:e.target.value})}/></label>
   <label>Semana sugerida<select value={editing.semana_sugerida||'Semana 1'} onChange={e=>setEditing({...editing,semana_sugerida:e.target.value})}>{['Semana 1','Semana 2','Semana 3','Semana 4','Personalizado'].map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Duração padrão (dias)<input type="number" min="1" step="1" value={editing.duracao_padrao??''} onChange={e=>setEditing({...editing,duracao_padrao:e.target.value})}/></label>
   <label className="wide">Dependências<textarea rows={4} value={editing.dependencias||''} onChange={e=>setEditing({...editing,dependencias:e.target.value})}/></label>
  </div></fieldset>
  <fieldset><legend>4 · Interno</legend><div className="resource-form">
   <label>Responsável padrão<input value={editing.responsavel||''} onChange={e=>setEditing({...editing,responsavel:e.target.value})}/></label>
   <label className="wide">Descrição Técnica<textarea rows={5} value={editing.descricao_tecnica||''} onChange={e=>setEditing({...editing,descricao_tecnica:e.target.value})}/></label>
   <label className="wide">Observações Internas<textarea rows={4} value={editing.observacoes||''} onChange={e=>setEditing({...editing,observacoes:e.target.value})}/></label>
  </div></fieldset>
 </div>{formError&&<p className="error">{formError}</p>}<div className="detail-actions"><button className="btn btn-secondary" onClick={()=>{setEditing(null);setFormError('')}}>Cancelar</button><button className="btn btn-primary" onClick={saveResource}>Salvar solução</button></div></section></div>}</>
}
export function CommercialSimulator(){
 const {data,error}=useCommercial(),[selected,setSelected]=useState<string[]>([]);
 if(error)return <section className="admin-section"><p className="error">{error}</p></section>;
 if(!data)return <div className="loading-state">Preparando simulador...</div>;
 const resources=data.resources.filter((x:any)=>x.ativo),chosen=resources.filter((x:any)=>selected.includes(x.id)),params=data.parameters||{};
 const implantation=chosen.filter((x:any)=>x.tipo==='Implantação'),monthly=chosen.filter((x:any)=>x.tipo==='Mensalidade'),extras=chosen.filter((x:any)=>x.tipo==='Avulso');
 const totalUi=implantation.reduce((n:number,x:any)=>n+Number(x.ui||0),0),implant=totalUi*Number(params.valor_ui||0),monthlyValue=monthly.reduce((n:number,x:any)=>n+Number(x.valor_mensal||0),0),extraValue=extras.reduce((n:number,x:any)=>n+Number(x.valor_avulso||0),0),pix=implant*(1-Number(params.desconto_pix||0)/100);
 return <><section className="admin-section"><span className="eyebrow">Ferramenta interna</span><h2>Simulador Comercial</h2><p>Monte cenários sem vincular a uma empresa ou proposta.</p><div className="simulator-resources">{resources.map((x:any)=><label key={x.id}><input type="checkbox" checked={selected.includes(x.id)} onChange={e=>setSelected(e.target.checked?[...selected,x.id]:selected.filter(id=>id!==x.id))}/><span><b>{x.nome}</b><small>{x.tipo} · {x.tipo==='Implantação'?x.ui+' UI':money(x.tipo==='Mensalidade'?x.valor_mensal:x.valor_avulso)} · {x.obrigatoriedade||'Padrão'}</small></span></label>)}</div></section>
 <section className="admin-section simulator-summary"><h2>Resumo da Simulação</h2><div className="commercial-summary">{[['Quantidade de UI',totalUi],['Valor da UI',money(params.valor_ui)],['Investimento Inicial',money(implant)],['PIX',money(pix)],['Mensalidade',money(monthlyValue)],['Serviços Adicionais',money(extraValue)],['Primeiro investimento',money(implant+monthlyValue+extraValue)]].map(([a,b])=><article key={a}><small>{a}</small><b>{b}</b></article>)}</div><h3>Composição</h3><p><b>Implantação:</b> {implantation.map((x:any)=>x.nome).join(' · ')||'Nenhum item'}</p><p><b>Mensalidade:</b> {monthly.map((x:any)=>x.nome).join(' · ')||'Nenhum item'}</p><p><b>Serviços adicionais:</b> {extras.map((x:any)=>x.nome).join(' · ')||'Nenhum item'}</p></section></>
}

