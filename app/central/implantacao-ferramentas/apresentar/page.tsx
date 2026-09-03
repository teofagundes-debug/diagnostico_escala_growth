import type {Metadata} from 'next';
import {ToolImplementationPresentation} from '@/components/ToolImplementationPresentation';

export const metadata:Metadata={title:'Apresentação da Solução | Escala Vendas',robots:{index:false,follow:false}};

export default function Page(){return <ToolImplementationPresentation/>}
