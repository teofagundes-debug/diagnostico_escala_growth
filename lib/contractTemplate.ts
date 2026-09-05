export const CONTRACT_MINIMUM_TERM_MONTHS=12;

const money=(value:any)=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const lines=(items:Array<[string,any]>)=>items.filter(([,value])=>value!==null&&value!==undefined&&String(value).trim()!=='').map(([label,value])=>`${label}: ${value}`).join('\n');

export function buildHomologatedContract(input:{
 origin:'ESCALA_GROWTH'|'IMPLANTACAO_FERRAMENTAS';
 company:any;
 responsible?:any;
 provider?:any;
 commercialParameters?:any;
 resources?:any[];
 scope?:any[];
 financial?:any;
}){
 const {origin,company,responsible=company?.responsaveis?.[0]||{},provider={},commercialParameters={},resources=[],scope=[],financial={}}=input;
 const tools=origin==='IMPLANTACAO_FERRAMENTAS',term=Number(financial.prazo_contratual||CONTRACT_MINIMUM_TERM_MONTHS),index=commercialParameters.reajuste_indice||'IPCA';
 const names=Array.from(new Set(resources.map(item=>item?.nome||item?.nome_snapshot||item?.recurso_nome||item?.title).filter(Boolean)));
 const scopes=scope.map(item=>item?.definicao||item?.escopo_definido||item?.descricao).filter(Boolean);
 const servicesClause=names.length?`Serviços contratados: ${names.join(', ')}.`:'';
 const scopeClause=tools&&scopes.length?` Escopo validado: ${scopes.join('; ')}.`:'';
 const paymentTerms=[Number(commercialParameters.desconto_pix||financial.desconto_pix||0)>0?`O pagamento da implantação via PIX terá desconto de ${Number(commercialParameters.desconto_pix||financial.desconto_pix)}%.`:'',commercialParameters.juros_atraso!=null?`Sobre valores em atraso poderão incidir juros de ${Number(commercialParameters.juros_atraso)}% ao mês.`:'',commercialParameters.dias_tolerancia!=null?`Será observado o prazo de tolerância de ${Number(commercialParameters.dias_tolerancia)} dia(s).`:'' ].filter(Boolean);
 const adjustmentClause=index==='IGP-M'?'Os valores da mensalidade serão reajustados anualmente, a cada 12 (doze) meses, pela variação acumulada do IGP-M (Índice Geral de Preços – Mercado), divulgado pela Fundação Getulio Vargas, ou outro índice oficial que venha a substituí-lo.':'Os valores da mensalidade serão reajustados anualmente, a cada 12 (doze) meses, pela variação acumulada do IPCA (Índice Nacional de Preços ao Consumidor Amplo), divulgado pelo IBGE, ou outro índice oficial que venha a substituí-lo.';
 const object=tools?`O cliente contrata a Implantação de Ferramentas e o licenciamento dos recursos descritos na Proposta Comercial publicada. A Proposta Comercial e seu snapshot validado fazem parte integrante deste contrato e definem escopo, valores, recursos, serviços recorrentes e condições comerciais. ${servicesClause}${scopeClause}`:`O cliente contrata o Método Escala Growth, o Plano Estratégico, o Plano de Implantação, os serviços contratados, a Plataforma Nimble quando aplicável, suporte e acompanhamento. O Plano Estratégico, o Plano de Implantação e a Proposta Comercial fazem parte integrante deste contrato e definem escopo, valores, cronograma, serviços recorrentes e condições comerciais. ${servicesClause}`;
 const frozenCommercial=tools?`\nCondições da formalização: investimento inicial de ${money(financial.valor_implantacao)}, licenças de uso de ${money(financial.valor_mensalidade)} por mês e prazo contratual de ${term} meses.`:'';
 return [
  `1. Objeto da Contratação\n${object.trim()}`,
  '2. Formalização\nA contratação será formalizada por aceite eletrônico realizado no Portal do Cliente, com registro de data, hora e identificação do responsável.',
  `3. Prazo Contratual\nO contrato possui vigência mínima e única de ${term} (doze) meses, contada a partir da ativação dos serviços.`,
  `4. Pagamento e Nota Fiscal\nOs valores, condições e meios de pagamento são os constantes da Proposta Comercial publicada no Portal do Cliente. A respectiva Nota Fiscal será emitida e enviada ao e-mail cadastrado após a confirmação do pagamento. ${paymentTerms.join(' ')}${frozenCommercial}`,
  '5. Inadimplência\nO atraso no pagamento poderá resultar na suspensão dos serviços, sem prejuízo dos encargos previstos nas condições comerciais.',
  '6. Suporte\nO suporte será prestado de acordo com os serviços contratados e os canais oficiais disponibilizados pela Escala Vendas.',
  '7. LGPD\nAs partes comprometem-se a tratar dados pessoais de acordo com a Lei Geral de Proteção de Dados e somente para as finalidades necessárias à execução do contrato.',
  `8. Reajuste Anual\n${adjustmentClause}`,
  '9. Encerramento Antecipado\nCaso o contratante solicite o encerramento do contrato antes do término da vigência mínima de 12 (doze) meses, deverá quitar integralmente todas as obrigações financeiras ainda pendentes decorrentes do contrato, incluindo parcelas de implantação eventualmente não vencidas e mensalidades vincendas até o término do período contratado. A mesma regra será aplicada independentemente da forma de pagamento escolhida para a implantação ou para as mensalidades.',
  '10. Renovação Automática\nAo término de cada período contratual de 12 (doze) meses, o contrato será renovado automaticamente por igual período, mantendo todas as condições comerciais e contratuais vigentes, inclusive permanência mínima, reajustes, condições comerciais e demais obrigações previstas neste contrato. Caso qualquer das partes não tenha interesse na renovação automática, deverá formalizar essa decisão com antecedência mínima de 5 (cinco) dias corridos do término do ciclo contratual vigente. Na ausência dessa manifestação, o contrato será renovado automaticamente por novo período de 12 (doze) meses.',
  '11. Disposições Gerais\nAlterações de escopo deverão ser formalizadas. Os documentos publicados no Portal integram a contratação e prevalecem como referência operacional e comercial.',
  `12. Dados da Escala Vendas\n${lines([['Razão Social',provider.razao_social||provider.nome_fantasia||provider.nome_empresa||'Escala Vendas'],['CNPJ',provider.cnpj],['Endereço',provider.endereco],['Cidade',provider.cidade],['Estado',provider.estado],['CEP',provider.cep],['Site',provider.website],['E-mail',provider.email],['Telefone',provider.telefone]])}`,
  `13. Dados do Cliente\n${lines([['Razão Social',company.razao_social||company.nome_fantasia||company.nome],['CPF/CNPJ',company.cpf_cnpj],['Responsável',responsible.nome],['E-mail',responsible.email],['Telefone',responsible.telefone],['Endereço',[company.endereco,company.cidade,company.estado,company.cep].filter(Boolean).join(' · ')]])}`
 ].join('\n\n');
}
