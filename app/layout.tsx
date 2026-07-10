import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiagnÃ³stico Escala Growth",
  description: "Descubra onde sua empresa estÃ¡ perdendo oportunidades.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

