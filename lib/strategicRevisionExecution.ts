import type {Evidence} from './evidenceEngine';
import type {StrategicDecision,StrategicDimension} from './strategicEngine';
import {strategicInterventions} from './strategicInterventionEngine';
import {strategicActionPlan,type StrategicActionPlan} from './strategicActionPlanEngine';
import type {AgreedAction} from './strategicExecutionPlan';
import {consolidateContextualPrescriptions,isContextualExecutionAction,type ContextualPrescription} from './resourcePrescriptionResolver';

const dimensions=new Set(['ATRAIR','ABSORVER','CONVERTER','GERIR']);
export const normalizedDimension=(value:unknown)=>{const key=String(value||'').trim().toUpperCase();return dimensions.has(key)?key as StrategicDimension:null};

export function currentStrategicArtifacts(input:{baseDecision:StrategicDecision;evidences:Evidence[];primaryPriority?:string|null;parallelPriorities?:string[];strategicDirection?:string|null;acquisitionMovement?:StrategicDecision['acquisition_movement']}){
 const primary=normalizedDimension(input.primaryPriority)||input.baseDecision.primary_priority;
 const explicitParallel=(input.parallelPriorities||[]).map(normalizedDimension).filter(Boolean) as StrategicDimension[];
 const parallel=[...new Set((explicitParallel.length?explicitParallel:input.baseDecision.parallel_priorities||[]).filter(item=>item!==primary))];
 const decision:StrategicDecision={...input.baseDecision,primary_priority:primary,parallel_priorities:parallel,strategic_direction:String(input.strategicDirection||input.baseDecision.strategic_direction),acquisition_movement:input.acquisitionMovement??input.baseDecision.acquisition_movement};
 const interventions=strategicInterventions(decision,input.evidences||[]),actionPlan=strategicActionPlan(decision,interventions);
 return{decision,interventions,actionPlan};
}

const contextualAction=(item:any):AgreedAction=>({source_type:'CONSULTANT',action_origin:'CONTEXTUAL',source_action_code:null,contextual_action_key:item.contextual_action_key,recommended:{...item,source:'REVISAO_ESTRATEGICA',supporting_intervention_codes:item.intervention_codes,supporting_prescriptions:item.supporting_prescriptions},strategic_dimension:null,agreed_title:item.validated,agreed_objective:item.reason,agreed_indicator:'',agreed_target:'',responsible:'',due_date:'',agreed_horizon:'AGORA',status:'PLANNED',consultant_notes:'Decisão contextual validada na Revisão Estratégica.',strategic_change_reason:'A recomendação original foi substituída pela decisão contextual da revisão.',start_condition:'',completed_at:null});

export function reconcileRevisionActions(input:{sourceActions?:any[];actionPlan:StrategicActionPlan;contextualPrescriptions:ContextualPrescription[]}){
 const manual=(input.sourceActions||[]).filter(action=>!isContextualExecutionAction(action)&&(action.action_origin==='MANUAL'||action.source_type==='CONSULTANT')).map(action=>({...action,action_origin:'MANUAL',strategic_dimension:action.strategic_dimension||null,status:'PLANNED',completed_at:null}));
 const contextual=consolidateContextualPrescriptions(input.contextualPrescriptions||[]).map(contextualAction);
 const seen=new Set<string>();
 return[...manual,...contextual].filter(action=>{const identity=action.action_origin==='CONTEXTUAL'?`CONTEXTUAL:${action.contextual_action_key}`:`MANUAL:${action.id||action.agreed_title}:${action.agreed_objective}`;if(seen.has(identity))return false;seen.add(identity);return true});
}
