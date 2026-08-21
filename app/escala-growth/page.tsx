import type { Metadata } from "next";
import { AcquisitionLanding } from "@/components/acquisition/AcquisitionLanding";

const title = "Diagnóstico Escala Growth | Descubra os Gargalos da sua Operação Comercial";
const description = "Descubra forças, gargalos e prioridades da sua operação comercial com o Diagnóstico Escala Growth. Resultado online e disponível imediatamente após a conclusão.";
const canonical = "https://www.escalavendas.com.br/escala-growth";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical, siteName: "Escala Vendas", locale: "pt_BR", type: "website" },
  twitter: { card: "summary", title, description },
};

export default function EscalaGrowthPage() {
  return <AcquisitionLanding />;
}
