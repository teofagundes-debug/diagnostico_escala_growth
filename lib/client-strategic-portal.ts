import {implementationManagement,sortOperationalItems} from './implementation-management';
import {measurementTimeline} from './evolution-management';

const horizonLabels:Record<string,string>={AGORA:'Agora',DEPOIS:'Depois',QUANDO_ESTIVER_PRONTO:'Quando estiver pronto'};
const statusLabels:Record<string,string>={PLANNED:'Planejada',IN_PROGRESS:'Em andamento',COMPLETED:'Concluída',PUBLISHED:'Publicado',SUPERSEDED:'Substituído'};

export function publishedActionView(action:any){return{...action,horizon_label:horizonLabels[action.agreed_horizon]||action.agreed_horizon,agreed_responsible:action.responsible||null,agreed_due_date:action.due_date||null}}

export function selectCurrentPublishedPlan(plans:any[]){
 return [...(plans||[])].filter(plan=>plan.status==='PUBLISHED'&&plan.published_snapshot).sort((a,b)=>Number(b.version_number)-Number(a.version_number)||String(b.published_at||'').localeCompare(String(a.published_at||'')))[0]||null;
}

export function buildClientStrategicView(input:{plans:any[];implementations:any[];items:any[];measurements:any[];measurementItems:any[]}){
 const plan=selectCurrentPublishedPlan(input.plans),snapshot=plan?.published_snapshot||null;
 const implementation=plan?(input.implementations||[]).find(item=>item.plan_id===plan.id&&Number(item.plan_version)===Number(plan.version_number))||null:null;
 const rawItems=implementation?(input.items||[]).filter(item=>item.implementation_id===implementation.id):[];
 const management=implementation?implementationManagement(rawItems):null;
 const measurements=(input.measurements||[]).filter(item=>implementation&&item.implementation_id===implementation.id).map(measurement=>({...measurement,items:(input.measurementItems||[]).filter(item=>item.measurement_id===measurement.id)}));
 const timeline=measurementTimeline(measurements),latestMeasurement=timeline.at(-1)||null;
 const actions=Array.isArray(snapshot?.actions)?snapshot.actions:[];
 const groupedActions=Object.fromEntries(['AGORA','DEPOIS','QUANDO_ESTIVER_PRONTO'].map(horizon=>[horizon,actions.filter((action:any)=>action.agreed_horizon===horizon).map(publishedActionView)]));
 const ordered=management?sortOperationalItems(management.items):[];
 const nextSteps=ordered.filter((item:any)=>item.status!=='COMPLETED').slice(0,3).map((item:any)=>({title:item.agreed_title,status:statusLabels[item.status]||item.status,responsible:item.operational_responsible||'A definir',due_date:item.operational_due_date||null,overdue:item.is_overdue}));
 const attentionPoints=management?[...(management.summary.overdue_items?[`${management.summary.overdue_items} ação(ões) com prazo vencido.`]:[]),...(management.summary.missing_responsible?[`${management.summary.missing_responsible} ação(ões) aguardando definição de responsável.`]:[]),...(management.summary.missing_due_date?[`${management.summary.missing_due_date} ação(ões) aguardando definição de prazo.`]:[])]:[];
 return {available:Boolean(plan),plan:plan?{id:plan.id,version:Number(plan.version_number),status:statusLabels[plan.status]||plan.status,direction:plan.strategic_direction,priority:plan.primary_priority,movement:plan.acquisition_movement,notes:plan.general_consultant_notes,published_at:plan.published_at}:null,actions:groupedActions,implementation:implementation?{id:implementation.id,status:statusLabels[management!.summary.status]||management!.summary.status,summary:management!.summary,items:management!.items.map((item:any)=>({...item,status_label:statusLabels[item.status]||item.status,horizon_label:horizonLabels[item.agreed_horizon]||item.agreed_horizon}))}:null,evolution:{timeline,latest:latestMeasurement,has_measurement:Boolean(latestMeasurement)},next_steps:nextSteps,attention_points:attentionPoints};
}
