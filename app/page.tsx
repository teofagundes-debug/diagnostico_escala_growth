import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

const title = "Escala Vendas | Estratégia, Processos e Tecnologia para Vender Melhor";
const description = "Estratégia, processos e tecnologia para organizar operações comerciais, implantar CRM, Inteligência Artificial, automações e integrações e melhorar vendas.";
const siteUrl = "https://www.escalavendas.com.br";
const canonicalUrl = siteUrl + "/";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    siteName: "Escala Vendas",
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
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Escala Vendas LTDA",
    url: canonicalUrl,
    email: "contato@escalavendas.com.br",
    taxID: "60.328.666/0001-03",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Marechal Deodoro, 450, sala 505",
      addressLocality: "Curitiba",
      addressRegion: "PR",
      postalCode: "80010-010",
      addressCountry: "BR",
    },
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} /><LandingPage /></>;
}
