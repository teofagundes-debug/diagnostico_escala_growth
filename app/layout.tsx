import type { Metadata } from "next";
import "./globals.css";
import "./strategic-commercial.css";
import "./commercial-consolidation.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.escalavendas.com.br"),
  title: "Diagnóstico Escala Growth",
  description: "Descubra onde sua empresa está perdendo oportunidades.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head><meta charSet="utf-8" /></head>
      <body>{children}</body>
    </html>
  );
}


