import {isMaster} from '../../../lib/access';
const SUPABASE_URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({'Content-Type':'application/json','apikey':KEY!,'Authorization':`Bearer ${KEY}`});
async function get(path:string){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:headers(),cache:'no-store'});if(!r.ok)throw new Error(await r.text());return r.json()}
async function write(path:string,method:string,data:any){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method,headers:{...headers(),Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(data)});if(!r.ok)throw new Error(await r.text());return r.json()}
async function audit(entidade:string,entidade_id:string|null,acao:string,dados:any){await write('commercial_audit_log','POST',{entidade,entidade_id,acao,dados})}
export async function GET(req:Request){try{if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});const [parameters,resources,marketing]=await Promise.all([get('parametros_comerciais?select=*&limit=1'),get('catalogo_recursos?select=*&order=tipo,categoria,nome'),get('marketing_parametros?select=*&order=plataforma')]);return Response.json({parameters:parameters[0],resources,marketing})}catch(e:any){return Response.json({error:e?.message||'Não foi possível carregar os parâmetros.'},{status:500})}}
export async function POST(req:Request){try{
 if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
 const body=await req.json();
 if(body.action==='parameters'){
  const data={valor_ui:Number(body.valor_ui),desconto_pix:Number(body.desconto_pix),prazo_contratual:Number(body.prazo_contratual),validade_proposta:Number(body.validade_proposta),reajuste_indice:['IPCA','IGP-M'].includes(body.reajuste_indice)?body.reajuste_indice:'IPCA',reajuste_periodicidade:Number(body.reajuste_periodicidade||12),reajuste_mes_base:Number(body.reajuste_mes_base||1),multa_atraso:body.multa_atraso===''?null:Number(body.multa_atraso),juros_atraso:body.juros_atraso===''?null:Number(body.juros_atraso),dias_tolerancia:body.dias_tolerancia===''?null:Number(body.dias_tolerancia),updated_at:new Date().toISOString()};
  if(data.valor_ui<=0)return Response.json({error:'O Valor da UI deve ser maior que zero.'},{status:400});
  const rows=await get('parametros_comerciais?select=id&limit=1'),result=await write(rows[0]?`parametros_comerciais?id=eq.${rows[0].id}`:'parametros_comerciais',rows[0]?'PATCH':'POST',data);
  await audit('parametros_comerciais',result[0]?.id||null,'Configurações financeiras atualizadas',data);
  return Response.json({ok:true,parameters:result[0]});
 }
 if(body.action==='resource'){
  const type=['Implantação','Mensalidade','Avulso'].includes(body.tipo)?body.tipo:'Implantação';
  const requirement=['Obrigatório','Padrão','Sob Demanda'].includes(body.obrigatoriedade)?body.obrigatoriedade:'Padrão';
  if(!body.codigo?.trim()||!body.categoria?.trim()||!body.nome?.trim())return Response.json({error:'Código, categoria e nome são obrigatórios.'},{status:400});
  if(type==='Implantação'&&Number(body.ui)<=0)return Response.json({error:'Informe uma UI maior que zero para serviços de Implantação.'},{status:400});
  if(type==='Mensalidade'&&(body.valor_mensal===''||body.valor_mensal==null||Number(body.valor_mensal)<0))return Response.json({error:'Informe o Valor Mensal do serviço.'},{status:400});
  if(type==='Avulso'&&(body.valor_avulso===''||body.valor_avulso==null||Number(body.valor_avulso)<0))return Response.json({error:'Informe o Valor do serviço avulso.'},{status:400});
  const data:any={codigo:String(body.codigo).trim(),categoria:String(body.categoria).trim(),nome:String(body.nome).trim(),descricao:body.descricao||null,tipo:type,ui:type==='Implantação'?Number(body.ui):null,valor_mensal:type==='Mensalidade'?Number(body.valor_mensal):null,valor_avulso:type==='Avulso'?Number(body.valor_avulso):null,obrigatoriedade:requirement,responsavel:body.responsavel||null,prioridade:body.prioridade||'Média',observacoes:body.observacoes||null,ativo:body.ativo!==false,updated_at:new Date().toISOString()};
  const result=await write(`catalogo_recursos${body.id?`?id=eq.${body.id}`:''}`,body.id?'PATCH':'POST',data);
  await audit('catalogo_recursos',result[0]?.id||body.id||null,body.id?'Serviço atualizado':'Serviço criado',data);
  return Response.json({ok:true,resource:result[0]});
 }
 if(body.action==='marketing'){for(const p of body.platforms||[]){const serviceName=p.plataforma==='Google Ads'?'Gestão Google Ads':'Gestão Meta Ads',service=(await get('catalogo_recursos?nome=eq.'+encodeURIComponent(serviceName)+'&tipo=eq.Mensalidade&select=id&limit=1'))[0],data={plataforma:p.plataforma,codigo:p.codigo,servico_id:service?.id||p.servico_id||null,objetivo_padrao:p.objetivo_padrao||null,regiao_atuacao:p.regiao_atuacao||null,publico_alvo:p.publico_alvo||null,verba_recomendada:Number(p.verba_recomendada||0),verba_aprovada:Number(p.verba_aprovada||0),landing_page_url:p.landing_page_url||null,conta_google_ads:p.plataforma==='Google Ads'?(p.conta_google_ads||null):null,conta_meta_ads:p.plataforma==='Meta Ads'?(p.conta_meta_ads||null):null,status_campanha:p.status_campanha||'Planejamento',observacoes_operacionais:p.observacoes_operacionais||null,ativo:p.ativo!==false,updated_at:new Date().toISOString()};await write('marketing_parametros?on_conflict=plataforma','POST',data);await audit('marketing_parametros',service?.id||null,'Configuração operacional atualizada',{plataforma:p.plataforma,status_campanha:data.status_campanha})}return Response.json({ok:true})}
 return Response.json({error:'Ação inválida.'},{status:400});
}catch(e:any){return Response.json({error:e?.message||'Não foi possível salvar.'},{status:500})}}
export async function DELETE(req:Request){try{if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});const id=new URL(req.url).searchParams.get('id');if(!id)return Response.json({error:'Serviço não informado.'},{status:400});await write(`catalogo_recursos?id=eq.${encodeURIComponent(id)}`,'PATCH',{ativo:false,updated_at:new Date().toISOString()});await audit('catalogo_recursos',id,'Serviço arquivado',{});return Response.json({ok:true})}catch(e:any){return Response.json({error:e?.message||'Não foi possível arquivar.'},{status:500})}}

