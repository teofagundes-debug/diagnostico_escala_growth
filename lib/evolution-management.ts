export type EvolutionSituation='IMPROVED'|'STABLE'|'WORSENED'|'NO_DATA';

export function compareEvolution(baseline:any,current:any):{variation:number|null;situation:EvolutionSituation}{
 if(baseline===null||baseline===undefined||baseline===''||current===null||current===undefined||current==='')return{variation:null,situation:'NO_DATA'};
 const initial=Number(baseline),actual=Number(current);if(!Number.isFinite(initial)||!Number.isFinite(actual))return{variation:null,situation:'NO_DATA'};
 const variation=actual-initial;return{variation,situation:variation>0?'IMPROVED':variation<0?'WORSENED':'STABLE'};
}

export function evolutionReading(baseline:Record<string,any>,current:Record<string,any>){
 return Object.keys(baseline).map(key=>({key,baseline:baseline[key]?.value??baseline[key],current:current[key]?.value??current[key]??null,label:baseline[key]?.label||key,...compareEvolution(baseline[key]?.value??baseline[key],current[key]?.value??current[key])}));
}

export function measurementTimeline(measurements:any[]){return [...measurements].sort((a,b)=>String(a.measured_at).localeCompare(String(b.measured_at))).map((measurement,index,all)=>{const values=Object.fromEntries((measurement.items||[]).map((item:any)=>[item.indicator_key,item.current_value]));const baseline=Object.fromEntries((measurement.items||[]).map((item:any)=>[item.indicator_key,item.baseline_value]));const previous=index?Object.fromEntries((all[index-1].items||[]).map((item:any)=>[item.indicator_key,item.current_value])):null;return{...measurement,reading:evolutionReading(baseline,values),previous_reading:previous?evolutionReading(previous,values):[]}})}
