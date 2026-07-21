import Link from "next/link";
import { brandLogo } from "@/components/brand";
import styles from "./LandingPage.module.css";

const links = [
  ["Como funciona", "#como-funciona"],
  ["O que analisamos", "#indice"],
  ["O que podemos implantar", "#solucoes"],
  ["Perguntas frequentes", "#faq"],
];

export function PublicHeader() {
  return (
    <header className={styles.publicHeader}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/inicio" aria-label="Escala Growth — início">
          <img src={brandLogo} alt="Escala Vendas" />
          <span>Escala Growth</span>
        </Link>
        <nav className={styles.desktopNavigation} aria-label="Navegação principal">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.clientLink} href="/login">Área do cliente</Link>
          <Link className={styles.primaryButtonSmall} href="/diagnostico">Fazer meu diagnóstico</Link>
        </div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Abrir menu">Menu</summary>
          <nav aria-label="Navegação móvel">
            {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
            <Link href="/login">Área do cliente</Link>
            <Link className={styles.mobileCta} href="/diagnostico">Fazer meu diagnóstico</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
