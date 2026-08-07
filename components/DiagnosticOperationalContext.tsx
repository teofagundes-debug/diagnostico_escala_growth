'use client';

import type {OperationalContext} from '@/lib/diagnostic';

const volumes=['Até 50','51 a 100','101 a 300','301 a 500','501 a 1.000','Mais de 1.000','Não sabe informar'];
const channels=['WhatsApp','Instagram Direct','Facebook Messenger','Webchat do site','Formulário do site / Landing Page','Telefone','E-mail','Outros','Não existe um canal definido'];
const tools=['WhatsApp Business App','WhatsApp Oficial / API','CRM','Plataforma de atendimento','Agente de IA','Automação','Dashboard / BI','Outros','Nenhuma'];
const indicators=['Novos contatos / leads','Oportunidades','Tempo de atendimento','Conversão','Vendas','Faturamento','Ticket médio','Custo por oportunidade / lead','Investimento em marketing','Retorno sobre investimento','Motivos de perda','Outros','Nenhum'];

function MultiSelect({title,items,value,onChange}:{title:string;items:string[];value:string[];onChange:(value:string[])=>void}){
 return <fieldset className="context-fieldset"><legend>{title}</legend><div className="context-options">{items.map(item=><label key={item}><input type="checkbox" checked={value.includes(item)} onChange={event=>onChange(event.target.checked?[...value.filter(current=>current!=='Nenhuma'&&current!=='Não existe um canal definido'),item]:value.filter(current=>current!==item))}/><span>{item}</span></label>)}</div></fieldset>
}

export function DiagnosticOperationalContext({value,onChange}:{value:OperationalContext;onChange:(value:OperationalContext)=>void}){
 return <div className="operational-context-form">
  <div className="field"><label>Quantos novos contatos comerciais sua empresa recebe, em média, por mês?</label><select value={value.volume_contatos} onChange={event=>onChange({...value,volume_contatos:event.target.value})}><option value="">Selecione</option>{volumes.map(item=><option key={item}>{item}</option>)}</select></div>
  <MultiSelect title="Por quais canais sua empresa recebe e atende contatos comerciais atualmente?" items={channels} value={value.canais} onChange={canais=>onChange({...value,canais})}/>
  <div className="field"><label>Quantas pessoas participam atualmente do atendimento e/ou processo comercial?</label><input type="number" min="0" inputMode="numeric" value={value.quantidade_pessoas} onChange={event=>onChange({...value,quantidade_pessoas:event.target.value})}/></div>
  <MultiSelect title="Quais ferramentas a empresa utiliza atualmente para atendimento e gestão comercial?" items={tools} value={value.ferramentas} onChange={ferramentas=>onChange({...value,ferramentas})}/>
  <div className="field"><label>Nome da ferramenta ou fornecedor atual (quando aplicável)</label><input value={value.ferramenta_atual} onChange={event=>onChange({...value,ferramenta_atual:event.target.value})}/></div>
  <MultiSelect title="Quais indicadores comerciais a empresa acompanha atualmente?" items={indicators} value={value.indicadores} onChange={indicadores=>onChange({...value,indicadores})}/>
 </div>
}
