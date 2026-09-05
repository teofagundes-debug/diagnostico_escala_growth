import Link from "next/link";
import { WebchatWidget } from "./WebchatWidget";
import styles from "./LandingPage.module.css";

export function PublicFooter({ fromSubpage = false }: { fromSubpage?: boolean }) {
  const section = (id: string) => `${fromSubpage ? "/" : ""}#${id}`;
  return <footer id="contato" className={styles.footer}><div className={styles.footerInner}><div><strong>Escala Vendas LTDA</strong><p>CNPJ: 60.328.666/0001-03</p><p>Rua Marechal Deodoro, 450, sala 505<br />Centro · Curitiba – PR · CEP 80010-010</p></div><div><strong>Soluções</strong><a href={section("implantacao")}>Implantação de Ferramentas</a><a href={section("consultoria")}>Consultoria Comercial</a><Link href="/escala-growth">Método Escala Growth</Link><Link href="/diagnostico">Diagnóstico</Link></div><WebchatWidget /><nav aria-label="Acesso"><strong>Acesso</strong><Link href="/login">Área do Cliente</Link><a href="mailto:contato@escalavendas.com.br">Contato</a><a href={section("empresa")}>Empresa</a></nav></div><p className={styles.copyright}>© {new Date().getFullYear()} Escala Vendas. Todos os direitos reservados.</p></footer>;
}
