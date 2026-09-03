/* eslint-disable @typescript-eslint/no-explicit-any */
import {isMaster} from '@/lib/access';
import {normalizeBrazilianWhatsApp} from '@/lib/brazilianWhatsapp';
import {initialToolProposal} from '@/lib/toolImplementation';
import {mappedResourceRequests,priceToolResources,toolCommercialSnapshot,toolCommercialTotals} from '@/lib/toolCommercialPricing';
const URL=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers=()=>({'Content-Type':'application/json',apikey:KEY!,Authorization:`Bearer ${KEY}`});
async function db(path:string,init:RequestInit={}){const response=await fetch(`${URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init.headers||{})},cache:'no-store'}),value=await response.text();if(!response.ok)throw new Error(value);return value?JSON.parse(value):[]}
async function commercialData(){const [catalog,mappings,parameters]=await Promise.all([db('catalogo_recursos?select=*&order=categoria,nome'),db('implantacao_ferramentas_mapeamentos?ativo=eq.true&select=*'),db('parametros_comerciais?select=*&limit=1')]);return{catalog,mappings,parameters:parameters[0]||{}}}

export async function POST(req:Request){try{
 if(!URL||!KEY)return Response.json({ok:false,error:'Persistência não configurada.'},{status:503});
 const body=await req.json(),whatsapp=normalizeBrazilianWhatsApp(body.whatsapp);
 if(!body.nome?.trim()||!body.empresa?.trim()||!body.email?.trim()||!whatsapp)return Response.json({ok:false,error:'Informe nome, empresa, e-mail e WhatsApp válidos.'},{status:400});
 if(!['COMERCIAL','ATENDIMENTO','COMERCIAL_E_ATENDIMENTO'].includes(body.area))return Response.json({ok:false,error:'Selecione a área de interesse.'},{status:400});
 const proposal=initialToolProposal(body);if(!proposal.solutions.length&&!body.answers?.other_need)return Response.json({ok:false,error:'Selecione ao menos uma necessidade.'},{status:400});
 const payload={nome:String(body.nome).trim(),empresa:String(body.empresa).trim(),email:String(body.email).trim().toLowerCase(),whatsapp,area_interesse:body.area,solucoes_selecionadas:proposal.solutions,respostas:body.answers||{},configuracao_sugerida:proposal.configuration,itens_validacao:proposal.validation,sintese:proposal.synthesis,itens_implantacao:proposal.implementationItems};
 const projectId=await db('rpc/registrar_diagnostico_implantacao',{method:'POST',body:JSON.stringify({payload})});
 const commercial=await commercialData(),requests=mappedResourceRequests(proposal.configuration,commercial.mappings),items=priceToolResources(requests,commercial.catalog,commercial.parameters.valor_ui),snapshot=toolCommercialSnapshot(items,commercial.parameters),rows=await db(`pre_propostas_implantacao?projeto_id=eq.${encodeURIComponent(projectId)}&select=id&order=versao.desc&limit=1`);
 if(rows[0])await db(`pre_propostas_implantacao?id=eq.${encodeURIComponent(rows[0].id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({itens_comerciais:items,snapshot_comercial:snapshot,financeiro:{...snapshot.totals,condicoes:null}})});
 return Response.json({ok:true,projeto_id:projectId,message:'Recebemos suas informações.'},{status:201});
 }catch(error:any){console.error('[tool-implementation] Falha ao criar projeto',error);return Response.json({ok:false,error:'Não foi possível enviar suas informações. Tente novamente.'},{status:500})}}

export async function GET(req:Request){try{
 if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
 const id=new globalThis.URL(req.url).searchParams.get('id'),filter=id?`id=eq.${encodeURIComponent(id)}&`:'';
 const [projects,commercial]=await Promise.all([db(`projetos_implantacao_ferramentas?${filter}select=*,empresas(id,nome),responsaveis(id,nome,email,telefone),pre_propostas_implantacao(*),pre_propostas_implantacao_historico(*)&order=created_at.desc`),commercialData()]);
 if(id)return Response.json(projects);
 return Response.json({projects,catalog:commercial.catalog.filter((item:any)=>item.ativo!==false).map((item:any)=>({id:item.id,codigo:item.codigo,nome:item.nome,categoria:item.categoria,tipo:item.tipo_comercial||item.tipo,ui:item.ui,valor_mensal:item.valor_mensalidade_padrao??item.valor_mensal,impacta_financeiro:item.impacta_financeiro})),parameters:{valor_ui:commercial.parameters.valor_ui}});
 }catch(error:any){return Response.json({error:error?.message||'Não foi possível carregar os projetos.'},{status:500})}}

export async function PATCH(req:Request){try{
 if(!await isMaster(req))return Response.json({error:'Acesso exclusivo do Usuário Master.'},{status:403});
 const body=await req.json(),projectId=String(body.projeto_id||''),proposalId=String(body.pre_proposta_id||'');if(!projectId||!proposalId)return Response.json({error:'Projeto e pré-proposta são obrigatórios.'},{status:400});
 const status=String(body.status||'RASCUNHO');if(!['RASCUNHO','EM_VALIDACAO','VALIDADA'].includes(status))return Response.json({error:'Status inválido nesta fase.'},{status:400});
 const stored=(await db(`pre_propostas_implantacao?id=eq.${encodeURIComponent(proposalId)}&projeto_id=eq.${encodeURIComponent(projectId)}&select=*&limit=1`))[0];if(!stored)return Response.json({error:'Pré-proposta não encontrada.'},{status:404});if(stored.status==='VALIDADA')return Response.json({error:'Os valores desta versão validada estão congelados.'},{status:409});
 const commercial=await commercialData(),requested=(body.itens_comerciais||[]).map((item:any)=>({resource_id:item.resource_id,quantity:item.quantidade,unit:item.unidade,origins:item.origens||['CONSULTOR']})),items=priceToolResources(requested,commercial.catalog,commercial.parameters.valor_ui,stored.itens_comerciais||[],body.action==='refresh_prices'),totals=toolCommercialTotals(items),resolved=new Set(body.resolved_scope_solution_ids||[]),project=(await db(`projetos_implantacao_ferramentas?id=eq.${encodeURIComponent(projectId)}&select=solucoes_selecionadas&limit=1`))[0],pending=(project?.solucoes_selecionadas||[]).filter((id:string)=>['PROCESS_AUTOMATION','SYSTEM_INTEGRATION'].includes(id)&&!resolved.has(id));
 if(status==='VALIDADA'&&pending.length)return Response.json({error:'Resolva explicitamente todos os itens com escopo a validar antes de validar a solução.',pending},{status:409});
 const now=new Date().toISOString(),snapshot=toolCommercialSnapshot(items,{...commercial.parameters,valor_ui:items[0]?.valor_ui??commercial.parameters.valor_ui}),financeiro={...body.financeiro,...totals},proposal={sintese:body.sintese||null,configuracao:body.configuracao||{},itens_implantacao:body.itens_implantacao||[],itens_comerciais:items,snapshot_comercial:snapshot,financeiro,observacoes_internas:body.observacoes_internas||null,status,updated_at:now,...(status==='VALIDADA'?{validada_em:now,validada_por:'Usuário Master',snapshot_final:{sintese:body.sintese||null,configuracao:body.configuracao||{},itens_implantacao:body.itens_implantacao||[],itens_comerciais:items,snapshot_comercial:snapshot,financeiro}}:{})};
 await db(`pre_propostas_implantacao?id=eq.${encodeURIComponent(proposalId)}&projeto_id=eq.${encodeURIComponent(projectId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(proposal)});
 await db(`projetos_implantacao_ferramentas?id=eq.${encodeURIComponent(projectId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status_comercial:status==='VALIDADA'?'VALIDADO':status==='EM_VALIDACAO'?'EM_VALIDACAO':'NOVO',sintese_necessidade:body.sintese||null,updated_at:now})});
 const refreshed=body.action==='refresh_prices';await db('pre_propostas_implantacao_historico',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({projeto_id:projectId,pre_proposta_id:proposalId,evento:status==='VALIDADA'?'SOLUCAO_VALIDADA':refreshed?'VALORES_ATUALIZADOS':'PRE_PROPOSTA_ATUALIZADA',descricao:status==='VALIDADA'?'Solução validada. Nenhum envio ao cliente foi realizado.':refreshed?'Valores atualizados explicitamente pelo catálogo vigente.':'Pré-proposta interna atualizada.',usuario:'Usuário Master',metadata:{status}})});
 return Response.json({ok:true,items,financeiro,message:status==='VALIDADA'?'Solução validada. A pré-proposta continua interna.':refreshed?'Valores atualizados pelo catálogo atual.':'Pré-proposta salva.'});
 }catch(error:any){console.error('[tool-implementation] Falha ao salvar pré-proposta',error);return Response.json({error:error?.message||'Não foi possível salvar a pré-proposta.'},{status:500})}}
