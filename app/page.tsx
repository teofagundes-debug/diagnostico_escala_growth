import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

const title = "Escala Growth | Organize sua operação comercial para crescer";
const description = "Descubra os gargalos da sua operação comercial com o Diagnóstico Escala Growth e identifique como melhorar processos, atendimento, vendas e indicadores.";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.escala-growth.escalavendas.com.br").replace(/\/+$/, "");
const canonicalUrl = siteUrl + "/";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    siteName: "Escala Growth",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Home() {
  return <LandingPage />;
}
