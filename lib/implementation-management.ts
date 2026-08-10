export type OperationalStatus='PLANNED'|'IN_PROGRESS'|'COMPLETED';

const dayMs=86400000;
const dateOnly=(value:any)=>value?String(value).slice(0,10):'';
const todayUtc=(now=new Date())=>Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());

export function itemManagement(item:any,now=new Date()){
 const due=dateOnly(item.operational_due_date);
 const dueMs=due?Date.parse(due+'T00:00:00Z'):NaN;
 const is_overdue=item.status!=='COMPLETED'&&Boolean(due)&&dueMs<todayUtc(now);
 const days_overdue=is_overdue?Math.max(1,Math.floor((todayUtc(now)-dueMs)/dayMs)):0;
 const missing_responsible=!String(item.operational_responsible||'').trim();
 const missing_due_date=!due&&item.agreed_horizon!=='QUANDO_ESTIVER_PRONTO';
 return {...item,is_overdue,days_overdue,missing_responsible,missing_due_date};
}

export function implementationManagement(items:any[],now=new Date()){
 const managed=items.map(item=>itemManagement(item,now));
 const total_items=managed.length;
 const planned_items=managed.filter(item=>item.status==='PLANNED').length;
 const in_progress_items=managed.filter(item=>item.status==='IN_PROGRESS').length;
 const completed_items=managed.filter(item=>item.status==='COMPLETED').length;
 const overdue_items=managed.filter(item=>item.is_overdue).length;
 const missing_responsible=managed.filter(item=>item.missing_responsible).length;
 const missing_due_date=managed.filter(item=>item.missing_due_date).length;
 const progress_percentage=total_items?Math.round(completed_items/total_items*100):0;
 const status:OperationalStatus=total_items>0&&completed_items===total_items?'COMPLETED':in_progress_items>0||completed_items>0?'IN_PROGRESS':'PLANNED';
 const future=managed.filter(item=>item.status!=='COMPLETED'&&item.operational_due_date&&Date.parse(String(item.operational_due_date).slice(0,10)+'T00:00:00Z')>=todayUtc(now)).sort((a,b)=>String(a.operational_due_date).localeCompare(String(b.operational_due_date)));
 const applicable=Math.max(1,managed.filter(item=>item.operational_due_date||item.agreed_horizon!=='QUANDO_ESTIVER_PRONTO').length);
 const managerial_pending=overdue_items+missing_responsible+missing_due_date;
 const execution_risk=overdue_items>=3||overdue_items/applicable>.3?'CRITICAL':overdue_items>0||managerial_pending>=1?'ATTENTION':'CLEAR';
 const risk_text=execution_risk==='CRITICAL'?'A implantação apresenta concentração relevante de ações atrasadas e exige revisão imediata da execução.':execution_risk==='ATTENTION'?'A implantação possui pontos de atenção relacionados a prazos ou responsáveis que devem ser acompanhados.':'A implantação segue sem alertas operacionais relevantes no momento.';
 const horizons=Object.fromEntries(['AGORA','DEPOIS','QUANDO_ESTIVER_PRONTO'].map(horizon=>{const group=managed.filter(item=>item.agreed_horizon===horizon),completed=group.filter(item=>item.status==='COMPLETED').length;return[horizon,{total:group.length,completed,percentage:group.length?Math.round(completed/group.length*100):0}]}));
 return{items:managed,summary:{total_items,planned_items,in_progress_items,completed_items,overdue_items,progress_percentage,missing_responsible,missing_due_date,next_due_date:future[0]?.operational_due_date||null,next_due_title:future[0]?.agreed_title||null,execution_risk,risk_text,status,horizons}};
}

const rank:Record<string,number>={IN_PROGRESS:1,PLANNED:2,COMPLETED:3};
export function sortOperationalItems(items:any[]){return[...items].sort((a,b)=>Number(b.is_overdue)-Number(a.is_overdue)||(rank[a.status]??9)-(rank[b.status]??9)||(a.operational_due_date?0:1)-(b.operational_due_date?0:1)||String(a.operational_due_date||'9999').localeCompare(String(b.operational_due_date||'9999')))}
