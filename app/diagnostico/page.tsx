import type { Metadata } from "next";
import { DiagnosticApp } from "@/components/DiagnosticApp";

const title = "Diagnóstico Escala Growth | Descubra seu Índice Escala Growth";
const description = "Avalie os pilares Atrair, Converter e Crescer e descubra onde sua operação possui maior potencial de evolução.";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.escala-growth.escalavendas.com.br").replace(/\/+$/, "");
const canonicalUrl = siteUrl + "/diagnostico";

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

export default function DiagnosticPage() {
  return <DiagnosticApp />;
}
