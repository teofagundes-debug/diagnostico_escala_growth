import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Escala Growth | Organize sua operação comercial para crescer",
  description: "Descubra os gargalos da sua operação comercial com o Diagnóstico Escala Growth e identifique como melhorar processos, atendimento, vendas e indicadores.",
};

export default function StartPage() {
  return <LandingPage />;
}
