import Link from 'next/link';
import type {Metadata} from 'next';
import {brandLogo} from '@/components/brand';
import styles from '../servicos/services.module.css';

export const metadata:Metadata={title:'Implantação de Ferramentas | Escala Vendas',description:'CRM, Inteligência Artificial, automação e integrações para sua operação.'};

export default function Page(){return <main className={styles.page}><header><Link href="/"><img src={brandLogo} alt="Escala Vendas"/></Link></header><section className={styles.hero}><span>Comercial e Atendimento</span><h1>Ferramentas certas.<br/>Implantação com direção.</h1><p>Estruturamos CRM, Inteligência Artificial, automações e integrações de acordo com a necessidade real da sua operação.</p><Link className={styles.cta} href="/implantacao-ferramentas/diagnostico">Encontrar a solução</Link></section><section className={styles.features}>{['CRM e gestão comercial','Agentes de Inteligência Artificial','Automação de atendimento','Automação de processos','Integração entre sistemas'].map(item=><article key={item}><i>✓</i><b>{item}</b></article>)}</section></main>}
