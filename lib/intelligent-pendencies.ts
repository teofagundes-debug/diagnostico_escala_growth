export type IntelligentPendencyDefinition={codigo:string;titulo:string;categoria:string;rota?:string;matches:string[];solutions?:string[]};
const code=(item:any)=>`SOLUCAO_${String(item.codigo||item.recurso_id||item.id||item.nome||item.nome_snapshot).toUpperCase().replace(/[^A-Z0-9]+/g,'_')}`;

// As regras operacionais pertencem à Biblioteca; este módulo apenas as interpreta.
export function pendingDefinitions(resources:any[]):IntelligentPendencyDefinition[]{
 const definitions=resources.filter(item=>(item.parametros_snapshot?.gera_pendencias??item.parametros_metodo?.gera_pendencias??item.gera_pendencias)===true).map(item=>{
  const parameters=item.parametros_snapshot||item.parametros_metodo||item,name=String(item.nome||item.nome_snapshot||'Solução');
  return{codigo:parameters.codigo_pendencia_padrao||code(item),titulo:parameters.titulo_pendencia_padrao||`Configurar ${name}`,categoria:item.categoria||'Implantação',rota:parameters.rota_configuracao_padrao||undefined,matches:[name],solutions:[name]};
 });
 return[...definitions.reduce((map:Map<string,IntelligentPendencyDefinition>,item)=>{const current=map.get(item.codigo);map.set(item.codigo,current?{...current,solutions:[...(current.solutions||[]),...(item.solutions||[])],matches:[...current.matches,...item.matches]}:item);return map},new Map()).values()];
}
