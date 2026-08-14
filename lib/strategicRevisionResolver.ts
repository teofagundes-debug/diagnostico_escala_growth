export type StrategicRevisionRecord={
 id?:string|null;
 status?:string|null;
 revisao_numero?:number|string|null;
 realizada_em?:string|null;
 created_at?:string|null;
 dados_reuniao?:any;
 [key:string]:any;
};

const time=(value:unknown)=>{const parsed=new Date(String(value||0)).getTime();return Number.isFinite(parsed)?parsed:0};
const completed=(meeting:StrategicRevisionRecord)=>String(meeting.status||'').toLowerCase()==='realizada';

/** Resolve a rodada canônica sem depender da data de agenda, que pode ser igual entre revisões. */
export function resolveCurrentStrategicRevision(meetings:StrategicRevisionRecord[]|null|undefined,explicitRevisionId?:string|null){
 const records=Array.isArray(meetings)?meetings.filter(Boolean):[];
 if(explicitRevisionId){const linked=records.find(item=>String(item.id)===String(explicitRevisionId));if(linked)return linked}
 const concluded=records.filter(completed),eligible=concluded.length?concluded:records.filter(item=>String(item.status||'').toLowerCase()!=='cancelada');
 return [...eligible].sort((a,b)=>Number(b.revisao_numero||1)-Number(a.revisao_numero||1)||time(b.realizada_em)-time(a.realizada_em)||time(b.created_at)-time(a.created_at))[0]||null;
}

export function currentPlatformResources(meeting:StrategicRevisionRecord|null|undefined){
 const data=meeting?.dados_reuniao||{},platform=data.situacao_plataforma||{};
 return Object.entries(platform).filter(([,status])=>['Implantado','Parcialmente Implantado'].includes(String(status))).map(([name,status])=>({name:name==='Outro'&&data.situacao_plataforma_outro?String(data.situacao_plataforma_outro):name,status:String(status)}));
}

const normalizedStatus=(value:unknown)=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');

/** Próximos passos documentais da revisão vigente; nunca são usados como fonte comercial. */
export function currentRevisionNextSteps(meeting:StrategicRevisionRecord|null|undefined,fallback=''){
 const data=meeting?.dados_reuniao||{},adaptive=Array.isArray(data.diagnostico_validado?.recomendacoes_adaptativas)?data.diagnostico_validado.recomendacoes_adaptativas:[];
 if(!adaptive.length)return String(fallback||'');
 const steps=adaptive.flatMap((item:any)=>{
  const status=normalizedStatus(item.status_recurso),resource=String(item.recurso||item.recomendacao_original||'recurso'),validated=String(item.recomendacao_validada||'').trim();
  if(status==='implantado')return item.adaptada||/otimiz|evolu|melhor|ampli/i.test(validated)?[validated||`Evoluir e otimizar ${resource}`]:[];
  if(status==='parcialmenteimplantado')return[validated||`Definir a conclusão ou evolução de ${resource}`];
  if(status==='naoimplantado'||status==='naoimplementado')return[validated||String(item.recomendacao_original||resource)];
  return validated?[validated]:[];
 });
 return Array.from(new Set(steps.filter(Boolean))).map(item=>`• ${item}`).join('\n');
}
