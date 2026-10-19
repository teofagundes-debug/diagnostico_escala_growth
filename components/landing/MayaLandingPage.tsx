import Link from "next/link";
import {LandingMotion} from "./LandingMotion";
import {PublicFooter} from "./PublicFooter";
import {PublicHeader} from "./PublicHeader";
import {ServiceVisual} from "./ServiceVisual";
import styles from "./MayaLandingPage.module.css";

const diagnostic="/implantacao-ferramentas/diagnostico?origem=maya";
const capabilities=[
  ["Atendimento contextual","Conversa com cada oportunidade considerando o contexto, as informações e as regras da sua empresa."],
  ["Identificação e qualificação","Coleta dados, entende a necessidade e ajuda a priorizar as oportunidades com maior aderência."],
  ["CRM atualizado","Registra e atualiza informações para reduzir perda de contexto e trabalho manual da equipe."],
  ["Transferência com contexto","Encaminha para uma pessoa quando necessário, levando o histórico e as informações já coletadas."],
  ["Canais contratados","Atua nos canais definidos para a operação, de acordo com o escopo validado na implantação."],
  ["Dados e indicadores","Organiza informações que ajudam a acompanhar volume, atendimento, qualificação e evolução da operação."],
];
const modules=["Maya Agenda","Follow-up","Reativação","Propostas","Integrações","Multicanal","Voz & Visão"];
const segments=["Imobiliárias","Clínicas odontológicas","Energia solar","Móveis planejados","Escolas e cursos","Clínicas de estética"];
const journey=["Atender","Entender","Qualificar","Organizar","Acompanhar","Vender melhor"];

export function MayaLandingPage(){return <div className={styles.page} data-landing-page>
  <LandingMotion/><PublicHeader current="implantacao"/>
  <main>
    <section className={styles.hero}><div className={styles.heroInner}><div className={styles.heroCopy}><span className={styles.eyebrow}>Inteligência Artificial para Comercial e Atendimento</span><h1>Maya – Sua assistente comercial com <em>Inteligência Artificial</em></h1><p>A Maya atende, entende, qualifica e ajuda sua equipe a transformar oportunidades em vendas.</p><div className={styles.actions}><Link className={styles.primary} href={diagnostic}>Quero conhecer a Maya</Link><a className={styles.secondary} href="#como-funciona">Ver como funciona</a></div><small>Solução configurada para cada operação dentro do processo de Implantação de Ferramentas.</small></div><aside className={styles.assistantPanel} aria-label="Resumo da atuação da Maya"><span>Maya em operação</span><div className={styles.signal}><i/><i/><i/></div><h2>Uma operação comercial assistida, do primeiro contato à equipe de vendas.</h2><ol>{journey.map((item,index)=><li key={item}><b>{String(index+1).padStart(2,"0")}</b>{item}</li>)}</ol></aside></div></section>

    <section className={styles.concept}><div className={styles.inner}><header><span className={styles.eyebrow}>Muito mais que atendimento</span><h2>Uma operação comercial assistida.</h2><p>A Maya não é apenas um chatbot. Ela é configurada para compreender a operação da empresa, seguir regras comerciais, organizar informações e trabalhar em conjunto com a equipe humana.</p></header><div className={styles.conceptGrid}><article><b>Sem contexto</b><p>Contatos repetem informações, aguardam retorno e chegam à equipe sem qualificação.</p></article><article className={styles.featured}><b>Com a Maya</b><p>Cada oportunidade avança com contexto, critérios definidos e continuidade para a equipe.</p></article></div></div></section>

    <section id="como-funciona" className={styles.capabilities}><div className={styles.inner}><header className={styles.heading}><span className={styles.eyebrow}>O que a Maya faz</span><h2>Atende a oportunidade e ajuda sua equipe a conduzir o próximo passo.</h2><p>As capacidades são definidas conforme a necessidade, os canais e os sistemas de cada empresa.</p></header><div className={styles.cardGrid}>{capabilities.map(([title,text],index)=><article key={title}><span>0{index+1}</span><ServiceVisual label={title}/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className={styles.flow}><div className={styles.inner}><header className={styles.heading}><span className={styles.eyebrow}>Como funciona na prática</span><h2>Da chegada do contato à continuidade da venda.</h2></header><ol>{journey.map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong></li>)}</ol><p>A Maya executa o que foi definido para a operação e entrega à equipe humana o contexto necessário para continuar a conversa.</p></div></section>

    <section className={styles.modules}><div className={styles.inner}><div className={styles.moduleIntro}><span className={styles.eyebrow}>Possibilidades de configuração</span><h2>Uma Maya, configurada para a realidade da sua empresa.</h2><p>Os módulos ampliam as possibilidades da solução conforme o escopo da implantação. Eles não são pacotes prontos: a configuração é definida após entendermos a operação.</p></div><div className={styles.moduleGrid}>{modules.map((module,index)=><article key={module}><span>{String(index+1).padStart(2,"0")}</span><ServiceVisual label={module}/><h3>{module}</h3><p>{moduleText(module)}</p></article>)}</div></div></section>

    <section className={styles.segments}><div className={styles.inner}><header className={styles.heading}><span className={styles.eyebrow}>Aplicações</span><h2>Adaptável a diferentes jornadas comerciais e de atendimento.</h2><p>A Maya pode ser configurada para diferentes segmentos — e não se limita a estes exemplos.</p></header><ul>{segments.map(item=><li key={item}>{item}</li>)}</ul></div></section>

    <section className={styles.people}><div className={styles.inner}><div><span className={styles.eyebrow}>Maya + equipe humana</span><h2>Inteligência Artificial para ampliar a capacidade das pessoas.</h2></div><div><p>A Maya assume etapas repetitivas, organiza informações e mantém a continuidade do contato. Sua equipe entra nos momentos em que experiência, negociação e decisão humana fazem a diferença.</p><blockquote>Tecnologia para organizar. Pessoas para vender.</blockquote></div></div></section>

    <section className={styles.results}><div className={styles.inner}><header className={styles.heading}><span className={styles.eyebrow}>Resultados acompanháveis</span><h2>Mais contexto, organização e visibilidade para evoluir a operação.</h2></header><ul>{["Tempo e continuidade do atendimento","Volume de contatos e oportunidades","Qualificação e encaminhamentos","Histórico organizado no CRM","Motivos, dúvidas e interesses recorrentes","Evolução dos próximos passos comerciais"].map(item=><li key={item}><span>✓</span>{item}</li>)}</ul></div></section>

    <section className={styles.commercial}><div><span className={styles.eyebrowLight}>Implantação personalizada</span><h2>Descubra como a Maya pode atuar na sua operação.</h2><p>Conte sua necessidade. A Escala Vendas analisa o cenário, define a implantação necessária e apresenta uma proposta personalizada.</p><Link className={styles.lightButton} href={diagnostic}>Iniciar análise da operação</Link><small>Sem preço público ou pacote pronto. Cada configuração é validada conforme a necessidade da empresa.</small></div></section>
  </main>
  <PublicFooter fromSubpage/>
</div>}

function moduleText(module:string){return ({"Maya Agenda":"Organiza agendamentos e confirmações dentro da jornada definida.","Follow-up":"Mantém a continuidade das oportunidades conforme regras e prazos.","Reativação":"Retoma contatos e oportunidades de acordo com critérios comerciais.","Propostas":"Apoia a coleta de informações e o avanço até a apresentação comercial.","Integrações":"Consulta, registra e atualiza dados nos sistemas previstos no escopo.","Multicanal":"Conecta a experiência nos canais definidos para a operação.","Voz & Visão":"Amplia as formas de interação quando a necessidade exigir."} as Record<string,string>)[module]}
