import type { Metadata } from "next";
import { DiagnosticApp } from "@/components/DiagnosticApp";

export const metadata: Metadata = {
  title: "Diagnóstico Escala Growth | Descubra seu Índice de Evolução",
  description: "Avalie os pilares Atrair, Converter e Crescer e descubra onde sua operação comercial possui maior potencial de evolução.",
};

export default function DiagnosticPage() {
  return <DiagnosticApp />;
}
