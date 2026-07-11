import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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

