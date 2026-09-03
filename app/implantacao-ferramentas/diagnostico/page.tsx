import type {Metadata} from 'next';
import {ToolImplementationDiagnostic} from '@/components/ToolImplementationDiagnostic';
export const metadata:Metadata={title:'Diagnóstico de Implantação | Escala Vendas',description:'Questionário rápido para preparar sua solução de CRM, IA, automação ou integração.',robots:{index:false,follow:false}};
export default function Page(){return <ToolImplementationDiagnostic/>}
