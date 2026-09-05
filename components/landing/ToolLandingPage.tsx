import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { InstitutionalFaq } from "./InstitutionalFaq";
import { LandingMotion } from "./LandingMotion";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import styles from "./ToolLandingPage.module.css";

const questionnaire = "/implantacao-ferramentas/diagnostico";
const services = [
  { number: "01", title: "CRM", text: "Centralize oportunidades, histórico, responsáveis e etapas comerciais para acompanhar melhor cada negociação.", items: ["Funil comercial", "Gestão de oportunidades", "Histórico de relacionamento", "Acompanhamento da equipe"], featured: true },
  { number: "02", title: "Agente de Inteligência Artificial", text: "Utilize IA para atender, qualificar, consultar informações e executar ações integradas à sua operação.", items: ["Atendimento e qualificação", "Consultas e agendamentos", "Execução de ações", "Transferência para equipe humana"], featured: true },
  { number: "03", title: "Automação de Atendimento", text: "Organize o primeiro contato, respostas, coleta de informações, encaminhamentos e atendimento fora do horário comercial.", items: ["Primeiro atendimento", "Coleta de informações", "Distribuição e encaminhamento"] },
  { number: "04", title: "Automação de Processos", text: "Automatize tarefas repetitivas e conecte etapas da operação para reduzir trabalho manual e aumentar a capacidade de execução.", items: ["Rotinas automatizadas", "Etapas conectadas", "Menos trabalho manual"] },
  { number: "05", title: "Integração entre Sistemas", text: "Conecte sistemas para consultar, enviar e atualizar informações entre diferentes etapas da operação.", items: ["APIs", "Webhooks", "Integrações"] },
];
const brands = [{ name: "Meta", src: "/technology-meta.png", width: 738, height: 414 }, { name: "WhatsApp", src: "/technology-whatsapp.jpg", width: 1920, height: 1080 }, { name: "Google", src: "/technology-google.png", width: 597, height: 335 }, { name: "OpenAI", src: "/technology-openai.png", width: 738, height: 414 }, { name: "Nimble", src: "/technology-nimble.png", width: 368, height: 112 }];
const situations = ["Precisamos organizar nossas oportunidades em um CRM.", "Queremos utilizar IA no atendimento ou nas vendas.", "Nosso atendimento ainda depende de muitos processos manuais.", "Precisamos automatizar uma rotina da operação.", "Precisamos conectar nosso sistema a outra ferramenta."];
const stages = [["01", "Conte sua necessidade", "Você responde um questionário rápido sobre o que deseja implantar."], ["02", "Preparamos uma configuração inicial", "Com base nas respostas, estruturamos uma solução inicial e os recursos necessários."], ["03", "Validamos juntos", "Na reunião, revisamos a solução, ajustamos escopo e quantidades e apresentamos o investimento."], ["04", "Implantamos", "Após a formalização, iniciamos a configuração e implantação dos recursos aprovados."]];
const deliveries = ["Configuração da solução", "Estruturação dos recursos", "Integração quando prevista no escopo", "Automação quando prevista no escopo", "Validação da implantação", "Orientação para utilização"];
const faqs = [
  ["Preciso fazer o Diagnóstico Growth antes de contratar uma ferramenta?", "Não. Se você já sabe o que precisa, pode seguir diretamente pelo questionário de Implantação de Ferramentas."],
  ["Posso contratar apenas um CRM?", "Sim. A solução pode incluir somente um CRM quando essa for a necessidade validada para a operação."],
  ["Posso contratar somente um Agente de Inteligência Artificial?", "Sim. O Agente de IA pode ser contratado como solução específica, respeitando o escopo e as integrações necessárias."],
  ["É possível combinar CRM, IA, automação e integrações no mesmo projeto?", "Sim. Diferentes recursos podem ser combinados quando fazem parte da mesma necessidade operacional validada."],
  ["Como vocês definem quais recursos serão necessários?", "Partimos das informações do questionário, preparamos uma configuração inicial e validamos recursos, escopo e quantidades com você em reunião."],
  ["O valor já é definido pelo questionário?", "Não. O questionário ajuda a preparar uma configuração inicial. A solução é validada em reunião e o investimento final é apresentado após os ajustes necessários."],
  ["O que acontece depois que eu envio o questionário?", "A Escala prepara uma configuração inicial. Na conversa, revisamos a necessidade, ajustamos a solução e apresentamos o investimento."],
  ["E se eu ainda não souber exatamente qual ferramenta preciso?", "O próprio questionário possui essa opção. A partir das informações iniciais, identificamos o caminho mais provável e validamos a solução com você."],
  ["Existe mensalidade?", "Dependendo dos recursos utilizados, a solução pode envolver licenças de uso mensais. Os valores são apresentados de forma clara na proposta."],
  ["Qual a diferença entre Implantação de Ferramentas e Consultoria de Crescimento Comercial?", "A Implantação atende uma necessidade tecnológica já identificada. A Consultoria começa entendendo os gargalos da operação para definir prioridades e um plano de evolução."],
];

export function ToolLandingPage() {
  return <div className={styles.page} data-landing-page>
    <LandingMotion />
    <PublicHeader current="implantacao" />
    <main>
      <section className={styles.hero} aria-labelledby="tool-landing-title"><div className={styles.heroInner}><div className={styles.heroCopy}><Eyebrow>Implantação de Ferramentas</Eyebrow><h1 id="tool-landing-title">A tecnologia certa<br />para sua operação<br /><em>funcionar melhor.</em></h1><p>Implantamos CRM, Inteligência Artificial, automações e integrações para organizar processos, melhorar o atendimento e dar mais capacidade de execução à sua operação comercial.</p><PrimaryCta>Quero implantar uma solução</PrimaryCta><small>Questionário rápido para entendermos sua necessidade e prepararmos uma configuração inicial.</small></div><aside className={styles.heroPanel}><span>Comercial e Atendimento</span><h2>Soluções conectadas à necessidade da sua operação.</h2><ul>{["CRM", "Inteligência Artificial", "Automação de Atendimento", "Automação de Processos", "Integração entre Sistemas"].map((item, index) => <li key={item}><b>0{index + 1}</b>{item}</li>)}</ul></aside></div></section>

      <section className={styles.solutions}><div className={styles.inner}><Heading eyebrow="Soluções" title={<>Ferramentas para organizar,<br />automatizar e conectar sua operação.</>}><p>A solução depende da necessidade da empresa. Podemos implantar um recurso específico ou combinar diferentes tecnologias dentro da mesma operação.</p></Heading><div className={styles.serviceGrid}>{services.map(service => <article className={service.featured ? styles.featuredService : ""} key={service.title}><span>{service.number}</span><h3>{service.title}</h3><p>{service.text}</p><ul>{service.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div></div></section>

      <section className={styles.technology}><div className={styles.inner}><Heading eyebrow="Tecnologias que utilizamos" title="Um ecossistema conectado à sua operação."><p>Combinamos tecnologias consolidadas para conectar atendimento, gestão, automação, aquisição e inteligência de acordo com a necessidade de cada projeto.</p></Heading><ul className={styles.brandGrid}>{brands.map(brand => <li key={brand.name}><Image src={brand.src} alt={brand.name} width={brand.width} height={brand.height} sizes="(max-width: 560px) 42vw, (max-width: 1080px) 28vw, 190px" /></li>)}</ul><blockquote><strong>A ferramenta não é o ponto de partida.<br />A necessidade da operação é.</strong><p>Primeiro entendemos o que precisa funcionar melhor. Depois definimos os recursos necessários para colocar a solução em prática.</p></blockquote></div></section>

      <section className={styles.audience}><div className={styles.inner}><Heading eyebrow="Para quem é" title={<>Para empresas que já identificaram<br />o que precisam melhorar.</>} /></div><div className={styles.situationGrid}>{situations.map((item, index) => <article key={item}><span>0{index + 1}</span><p>“{item}”</p></article>)}</div><div className={styles.unsure}><div><h3>Ainda não sabe exatamente qual solução precisa?</h3><p>Sem problema. O questionário possui uma opção para isso. A partir das informações iniciais, identificamos o caminho mais provável e validamos a solução com você.</p></div><PrimaryCta>Contar minha necessidade</PrimaryCta></div></section>

      <section className={styles.process}><div className={styles.inner}><Heading eyebrow="Como funciona" title="Da necessidade à solução validada." /><ol className={styles.stageGrid}>{stages.map(([number, title, text]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></li>)}</ol><div className={styles.processNote}><strong>Você não precisa passar por um diagnóstico comercial completo para contratar uma ferramenta.</strong><p>Se você já sabe o que precisa, seguimos diretamente para a configuração e validação da solução.</p></div></div></section>

      <section className={styles.delivery}><div className={styles.inner}><Heading eyebrow="Da solução à operação" title={<>Não entregamos apenas acesso à ferramenta.<br />Ajudamos a colocá-la para funcionar.</>} /><ul>{deliveries.map(item => <li key={item}><span>✓</span>{item}</li>)}</ul></div></section>

      <section className={styles.investment}><div className={styles.inner}><Heading eyebrow="Como funciona o investimento" title="Implantação + licenças de uso."><p>O investimento é composto pelos recursos necessários para colocar a solução em funcionamento e pelas licenças utilizadas na operação.</p></Heading><div className={styles.investmentGrid}><article><span>Investimento inicial</span><h3>Implantação</h3><p>Configuração e implantação dos recursos definidos para o projeto.</p></article><article><span>Uso mensal</span><h3>Licenças de uso</h3><p>Recursos e plataformas utilizados mensalmente pela operação.</p></article></div><p className={styles.commercialNote}>As condições finais são apresentadas após a validação da solução. Contrato conforme condições comerciais vigentes.</p></div></section>

      <section className={styles.alternative}><div><Eyebrow>Caminho alternativo</Eyebrow><h2>Seu desafio é maior do que a escolha de uma ferramenta?</h2><p>Se a empresa quer melhorar vendas, mas ainda precisa entender onde estão os principais gargalos da operação comercial, conheça nossa Consultoria de Crescimento Comercial.</p><Link href="/escala-growth">Conhecer a Consultoria <span aria-hidden="true">→</span></Link></div></section>

      <section className={styles.faq}><div className={styles.faqInner}><Heading eyebrow="Perguntas frequentes" title="Antes de começar sua implantação." /><InstitutionalFaq items={faqs} /></div></section>
      <section className={styles.finalCta}><div><Eyebrow light>Próximo passo</Eyebrow><h2>Conte o que sua empresa<br />precisa colocar para funcionar.</h2><p>Em poucos minutos, você nos ajuda a entender sua necessidade e preparar uma configuração inicial para nossa conversa.</p><PrimaryCta light>Quero implantar uma solução</PrimaryCta><small>Questionário rápido. Sem compromisso de contratação.</small></div></section>
    </main>
    <PublicFooter fromSubpage />
  </div>;
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) { return <span className={light ? styles.eyebrowLight : styles.eyebrow}>{children}</span>; }
function Heading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) { return <header className={styles.heading} data-reveal><Eyebrow>{eyebrow}</Eyebrow><h2>{title}</h2>{children}</header>; }
function PrimaryCta({ children, light = false }: { children: ReactNode; light?: boolean }) { return <Link className={light ? styles.ctaLight : styles.cta} href={questionnaire}>{children}</Link>; }
