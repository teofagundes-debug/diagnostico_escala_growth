import Link from "next/link";
import { brandLogo } from "@/components/brand";
import styles from "./LandingPage.module.css";

const links = [["Implantação de Ferramentas", "#implantacao"], ["Consultoria Comercial", "#consultoria"], ["Empresa", "#empresa"], ["Quem conduz", "#quem-conduz"]];

export function PublicHeader() {
  return (
    <header className={styles.publicHeader}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="Escala Vendas — início">
          <img src={brandLogo} alt="Escala Vendas" />
          <span>Escala Vendas</span>
        </Link>
        <nav className={styles.desktopNavigation} aria-label="Navegação principal">
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.clientLink} href="/login">Área do cliente</Link>
          <a className={styles.primaryButtonSmall} href="#contato">Falar com a Escala</a>
        </div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Abrir menu">Menu</summary>
          <nav aria-label="Navegação móvel">
            {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
            <Link href="/login">Área do cliente</Link>
            <a className={styles.mobileCta} href="#contato">Falar com a Escala</a>
          </nav>
        </details>
      </div>
    </header>
  );
}
