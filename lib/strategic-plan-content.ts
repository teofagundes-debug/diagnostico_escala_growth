const OBSERVATIONS_MARKER='\n\n--- OBSERVAÇÕES COMPLEMENTARES ---\n';

export function splitConsultantContent(value?:string|null){
 const content=String(value||'');
 const markerIndex=content.indexOf(OBSERVATIONS_MARKER);
 if(markerIndex<0)return{opinion:content,observations:''};
 return{opinion:content.slice(0,markerIndex),observations:content.slice(markerIndex+OBSERVATIONS_MARKER.length)};
}

export function joinConsultantContent(opinion:string,observations:string){
 const finalOpinion=opinion.trim(),complement=observations.trim();
 return complement?finalOpinion+OBSERVATIONS_MARKER+complement:finalOpinion;
}
