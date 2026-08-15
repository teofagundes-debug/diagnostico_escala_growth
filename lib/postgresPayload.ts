const typedOptionalFields={
 date:new Set(['due_date']),
 timestamp:new Set(['completed_at','published_at','updated_at','created_at','realizada_em','concluida_em']),
 numeric:new Set(['agreed_target_numeric','target_value','sort_order']),
 uuid:new Set(['id','plan_id','action_id','revisao_estrategica_id','canonical_resource_id','canonical_solution_id'])
};

const isEmpty=(value:unknown)=>typeof value==='string'&&value.trim()==='';

/** Normaliza valores opcionais antes de enviá-los a colunas tipadas do PostgreSQL. */
export function normalizePostgresPayload<T>(value:T):T{
 if(Array.isArray(value))return value.map(item=>normalizePostgresPayload(item)) as T;
 if(!value||typeof value!=='object')return value;
 const normalized:any={};
 for(const[key,current]of Object.entries(value as any)){
  const typed=Object.values(typedOptionalFields).some(fields=>fields.has(key));
  normalized[key]=typed&&isEmpty(current)?null:normalizePostgresPayload(current);
 }
 return normalized;
}

export function normalizeStrategicPlanActions<T extends Record<string,unknown>>(actions:T[]):T[]{
 return normalizePostgresPayload(actions);
}
