import type {Metadata} from "next";
import {MayaLandingPage} from "@/components/landing/MayaLandingPage";

export const metadata:Metadata={
  title:"Maya | Assistente Comercial com Inteligência Artificial | Escala Vendas",
  description:"Conheça a Maya, assistente comercial com Inteligência Artificial configurada para atender, entender, qualificar e organizar oportunidades junto à sua equipe.",
  alternates:{canonical:"https://www.escalavendas.com.br/maya"},
};

export default function Page(){return <MayaLandingPage/>}
