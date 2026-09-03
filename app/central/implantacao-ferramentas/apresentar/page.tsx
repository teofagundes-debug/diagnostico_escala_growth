import type {Metadata} from 'next';
import {ToolImplementationPresentation} from '@/components/ToolImplementationPresentation';

export const metadata:Metadata={title:'Apresentação da Solução | Escala Vendas',robots:{index:false,follow:false}};

export default async function Page({searchParams}:{searchParams:Promise<{projeto_id?:string;pre_proposta_id?:string}>}){const params=await searchParams;return <ToolImplementationPresentation projectId={params.projeto_id||''} proposalId={params.pre_proposta_id||''}/>}
