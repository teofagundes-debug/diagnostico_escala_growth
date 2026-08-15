const editableFields=['operational_responsible','operational_due_date','status','started_at','completed_at','execution_notes','execution_evidence'] as const;
const validStatuses=new Set(['PLANNED','IN_PROGRESS','COMPLETED']);

const optionalText=(value:unknown)=>typeof value==='string'&&value.trim()?value:null;
const dateOnly=(value:unknown)=>{
 const text=String(value||'').trim();
 if(!text)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||Number.isNaN(Date.parse(text+'T00:00:00Z')))throw new Error('Data operacional inválida.');
 return text;
};
const timestamp=(value:unknown)=>{
 const text=String(value||'').trim();
 if(!text)return null;
 const normalized=/^\d{4}-\d{2}-\d{2}$/.test(text)?text+'T12:00:00.000Z':text;
 if(Number.isNaN(Date.parse(normalized)))throw new Error('Data de execução inválida.');
 return normalized;
};

export function normalizeImplementationItemChanges(body:any){
 const changes:any={};
 for(const field of editableFields){
  if(body?.[field]===undefined)continue;
  if(field==='operational_due_date')changes[field]=dateOnly(body[field]);
  else if(field==='started_at'||field==='completed_at')changes[field]=timestamp(body[field]);
  else if(field==='status'){
   if(!validStatuses.has(String(body[field])))throw new Error('Status operacional inválido.');
   changes[field]=String(body[field]);
  }else changes[field]=optionalText(body[field]);
 }
 return changes;
}

export const implementationItemEditableFields=[...editableFields];
