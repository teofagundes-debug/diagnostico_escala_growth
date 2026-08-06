'use client';

import {useEffect,useState} from 'react';

const money=(value:unknown)=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

export function ExecutionStrategySummary({companyId}:{companyId:string}){
 const [resources,setResources]=useState<any[]>([]);
 useEffect(()=>{fetch(`/api/commercial-evolution?empresa_id=${companyId}`,{cache:'no-store'}).then(response=>response.json()).then(data=>{const project=(data.projects||[]).find((item:any)=>['Publicado','Aceito','Formalizado'].includes(item.status))||(data.projects||[])[0],items=(project?.projeto_evolucao_recursos||[]).filter((item:any)=>item.movimento==='Adicionar'&&(item.recomendado_metodo||['Recomendado','Opcional'].includes(item.classificacao)));setResources(items)}).catch(()=>setResources([]))},[companyId]);
 if(!resources.length)return null;
 return <section className="admin-section execution-strategy-summary"><span className="eyebrow">Histórico consolidado</span><h2>Estratégia de Implantação Aprovada</h2><p>Resumo somente para consulta. Alterações operacionais são realizadas no Projeto de Implantação ou em uma Reunião de Evolução.</p><div>{resources.map(item=><article key={item.recurso_id}><header><div><small>Recomendado pelo Método</small><h3>{item.nome_snapshot}</h3></div><span className="status-pill">{item.implantar_nesta_fase===false?'Evolução futura':item.implantar_nesta_fase===true?'Implantado nesta fase':'Configuração pendente'}</span></header>{item.implantar_nesta_fase===false?<p>Implantação: não nesta fase.</p>:<><p><b>Executor:</b> {item.executor||'A definir'}</p>{Number(item.investimento_aprovado||0)>0&&<p><b>Investimento aprovado:</b> {money(item.investimento_aprovado)}</p>}</>}</article>)}</div></section>;
}
