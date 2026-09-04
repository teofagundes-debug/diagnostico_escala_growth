export const TOOL_FORMALIZATION_ORIGIN='IMPLANTACAO_FERRAMENTAS' as const;

export function latestValidatedToolProposal(projects:any[]){
 return (projects||[]).flatMap(project=>(project.pre_propostas_implantacao||[]).map((proposal:any)=>({...proposal,project})))
  .filter(item=>['VALIDADA','FORMALIZACAO_ENVIADA'].includes(item.status))
  .sort((a,b)=>Number(b.versao||0)-Number(a.versao||0)||+new Date(b.validada_em||b.updated_at||0)-+new Date(a.validada_em||a.updated_at||0))[0]||null;
}

export function toolProposalFinancial(proposal:any){
 const source=proposal?.snapshot_final?.financeiro||proposal?.financeiro||{};
 return {valor_implantacao:Number(source.investimento_inicial||0),valor_mensalidade:Number(source.licencas_mensais||0),condicoes:source.condicoes||null};
}

export function toolProposalResources(proposal:any){
 const source=proposal?.snapshot_final?.itens_comerciais||proposal?.itens_comerciais||proposal?.snapshot_final?.itens_implantacao||proposal?.itens_implantacao||[];
 return Array.isArray(source)?source:[];
}

export function buildToolPortalSnapshot(input:{proposal:any;financial:any;contract:any;version:number;publishedAt:string}){
 const resources=toolProposalResources(input.proposal),proposalFinancial=toolProposalFinancial(input.proposal);
 return {
  flow:TOOL_FORMALIZATION_ORIGIN,
  proposal:{id:input.proposal.id,version:Number(input.proposal.versao||1),status:input.proposal.status,synthesis:input.proposal.sintese||input.proposal.project?.sintese_necessidade||null,configuration:input.proposal.snapshot_final?.configuracao||input.proposal.configuracao||{},resources,financial:proposalFinancial},
  financial:{...input.financial,...proposalFinancial},
  contract:input.contract,
  formalization_document:input.contract,
  orientacoes_iniciais:'Revise a Proposta Comercial e o Contrato/Termo. Em seguida, conclua o aceite para formalizar a Implantação de Ferramentas.',
  published_at:input.publishedAt,
  version:input.version
 };
}
