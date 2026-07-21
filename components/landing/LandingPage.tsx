import Link from "next/link";
import { PublicHeader } from "./PublicHeader";
import styles from "./LandingPage.module.css";

const problems = [
  ["01", "Clientes sem retorno", "Contatos chegam, mas nem todos recebem acompanhamento no momento correto."],
  ["02", "Atendimento desorganizado", "Conversas ficam espalhadas e a equipe perde contexto sobre cada cliente."],
  ["03", "Falta de processo comercial", "Cada vendedor trabalha de uma maneira e não existe um fluxo claro de acompanhamento."],
  ["04", "Pouca visibilidade", "A empresa não enxerga quantas oportunidades existem, onde estão os gargalos e o que precisa melhorar."],
  ["05", "Baixa previsibilidade", "As decisões são tomadas sem indicadores consistentes sobre atendimento, conversão e vendas."],
];

const stages = [
  ["1", "Diagnóstico", "Analisamos como sua empresa atrai, atende, acompanha e converte oportunidades."],
  ["2", "Estratégia", "Identificamos prioridades e definimos um plano adequado à realidade da sua operação."],
  ["3", "Implantação", "Estruturamos processos, ferramentas, automações, indicadores e recursos necessários."],
  ["4", "Evolução", "Acompanhamos os resultados e orientamos os próximos passos para o crescimento."],
];

const pillars = [
  ["Atrair", "Avalia como a empresa gera demanda, atrai novos contatos e transforma investimento em oportunidades comerciais."],
  ["Converter", "Avalia atendimento, velocidade de resposta, organização dos contatos, processo comercial e capacidade de transformar oportunidades em vendas."],
  ["Crescer", "Avalia indicadores, gestão, previsibilidade, acompanhamento de resultados e capacidade de evolução contínua."],
];

const solutions = ["Organização comercial", "CRM e gestão de oportunidades", "WhatsApp Oficial", "Agentes de Inteligência Artificial", "Automação de atendimento", "Integrações entre sistemas", "Dashboard Executivo", "Indicadores e relatórios", "Landing pages", "Google Ads", "Meta Ads", "Treinamento da equipe"];
const benefits = ["Visão centralizada das oportunidades", "Atendimento mais organizado", "Processos comerciais mais claros", "Menos clientes esquecidos", "Melhor acompanhamento da equipe", "Indicadores para tomada de decisão", "Uso estratégico de Inteligência Artificial", "Mais previsibilidade comercial"];
const audience = ["utilizam WhatsApp no atendimento ou nas vendas", "recebem contatos de diferentes canais", "possuem equipe comercial ou de atendimento", "querem organizar oportunidades", "desejam implantar automação ou Inteligência Artificial", "investem ou pretendem investir em divulgação", "precisam melhorar indicadores e previsibilidade", "sentem que estão perdendo oportunidades por falta de acompanhamento"];
const faqs = [
  ["O diagnóstico é gratuito?", "O diagnóstico inicial poderá ser realizado sem compromisso e tem como objetivo identificar o nível atual de estrutura da operação comercial da empresa."],
  ["Quanto tempo leva para responder?", "O tempo pode variar conforme as respostas, mas normalmente o preenchimento leva apenas alguns minutos."],
  ["O diagnóstico já apresenta uma proposta comercial?", "Não. Primeiro avaliamos a operação. A estratégia e as possíveis soluções são definidas posteriormente, de acordo com as necessidades identificadas."],
  ["Preciso utilizar Inteligência Artificial?", "Não necessariamente. A Inteligência Artificial é um dos recursos que podem ser recomendados. A prioridade é resolver os gargalos identificados."],
  ["A Escala Growth serve apenas para empresas que vendem pelo WhatsApp?", "Não. O WhatsApp é um canal importante, mas a metodologia também analisa processos, atendimento, vendas, indicadores, marketing e gestão das oportunidades."],
  ["O diagnóstico garante aumento de vendas?", "Não. O diagnóstico identifica oportunidades de melhoria e orienta decisões. Resultados comerciais dependem da execução, da operação, do mercado e do envolvimento da empresa."],
  ["O que acontece após o diagnóstico?", "Após a análise, a empresa poderá receber uma orientação inicial e, quando aplicável, avançar para uma reunião estratégica, Plano Estratégico e Plano de Implantação."],
];

export function LandingPage() {
  return (
    <div className={styles.landingPage}>
      <PublicHeader />
      <main>
        <section className={styles.heroSection} aria-labelledby="landing-title">
          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>Método Escala Growth</span>
              <h1 id="landing-title">Toda empresa cresce quando consegue acompanhar cada oportunidade.</h1>
              <p className={styles.heroLead}>Descubra os principais gargalos da sua operação comercial e receba uma visão estruturada sobre onde sua empresa precisa evoluir para vender com mais organização, controle e previsibilidade.</p>
              <div className={styles.heroButtons}>
                <Link className={styles.primaryButton} href="/diagnostico">Descobrir meu Índice Escala Growth</Link>
                <a className={styles.secondaryButton} href="#como-funciona">Conhecer a metodologia</a>
              </div>
              <p className={styles.heroNote}>Diagnóstico estratégico para empresas que desejam organizar processos, atendimento, vendas e indicadores.</p>
            </div>
            <aside className={styles.indexPreview} aria-label="Representação ilustrativa do Índice Escala Growth">
              <div className={styles.previewHeader}><span>Índice Escala Growth</span><small>Representação ilustrativa</small></div>
              <h2>Uma visão integrada da sua operação comercial.</h2>
              <div className={styles.previewBars}>
                {[
                  ["Atrair", "72%"],
                  ["Converter", "58%"],
                  ["Crescer", "43%"],
                ].map(([name, width]) => (
                  <div key={name} className={styles.previewBar}><span>{name}</span><i><b style={{ width }} /></i></div>
                ))}
              </div>
              <p>O diagnóstico revela forças, gargalos e prioridades — sem transformar esta prévia em uma pontuação real.</p>
            </aside>
          </div>
        </section>

        <section className={styles.problemSection} aria-labelledby="problem-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>O desafio</span>
              <h2 id="problem-title">Sua empresa pode estar perdendo oportunidades sem perceber.</h2>
              <p>Muitas empresas recebem contatos, investem em divulgação e possuem uma boa equipe, mas ainda enfrentam dificuldades para acompanhar cada oportunidade até a venda.</p>
            </div>
            <div className={styles.problemGrid}>
              {problems.map(([number, title, text]) => <article key={number} className={styles.problemItem}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
            </div>
            <p className={styles.sectionConclusion}>Antes de investir mais para atrair clientes, é preciso garantir que sua empresa consiga acompanhar melhor as oportunidades que já possui.</p>
          </div>
        </section>

        <section id="como-funciona" className={styles.methodSection} aria-labelledby="method-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}><span className={styles.eyebrow}>Como funciona</span><h2 id="method-title">Uma metodologia para transformar diagnóstico em evolução.</h2></div>
            <ol className={styles.stageFlow}>
              {stages.map(([number, title, text]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="indice" className={styles.indexSection} aria-labelledby="index-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>Índice Escala Growth</span>
              <h2 id="index-title">Entenda o nível de estrutura da sua operação comercial.</h2>
              <p>O diagnóstico avalia três pilares essenciais para o crescimento de uma empresa.</p>
            </div>
            <div className={styles.pillarGrid}>
              {pillars.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
            </div>
            <div className={styles.centeredAction}>
              <p>Ao final, você recebe uma visão clara dos principais pontos de atenção e das áreas com maior potencial de evolução.</p>
              <Link className={styles.primaryButton} href="/diagnostico">Descobrir meu Índice Escala Growth</Link>
            </div>
          </div>
        </section>

        <section id="solucoes" className={styles.solutionsSection} aria-labelledby="solutions-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>Da estratégia à execução</span>
              <h2 id="solutions-title">A tecnologia certa entra depois que entendemos o problema.</h2>
              <p>A Escala Growth não começa indicando ferramentas. Primeiro identificamos o que precisa ser organizado. Depois definimos quais recursos fazem sentido para a realidade da empresa.</p>
            </div>
            <ul className={styles.solutionGrid}>{solutions.map(solution => <li key={solution}><span aria-hidden="true">✓</span>{solution}</li>)}</ul>
            <p className={styles.subtleNote}>As soluções são recomendadas de acordo com o diagnóstico e podem variar conforme o estágio, a estrutura e os objetivos de cada empresa.</p>
          </div>
        </section>

        <section className={styles.benefitsSection} aria-labelledby="benefits-title">
          <div className={styles.sectionInner}>
            <div className={styles.benefitIntro}>
              <span className={styles.eyebrow}>O que muda na prática</span>
              <h2 id="benefits-title">Mais clareza para decidir. Mais estrutura para crescer.</h2>
              <blockquote>Tecnologia para organizar.<br />Pessoas para vender.</blockquote>
            </div>
            <ul className={styles.benefitList}>{benefits.map(benefit => <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>)}</ul>
          </div>
        </section>

        <section className={styles.audienceSection} aria-labelledby="audience-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}><span className={styles.eyebrow}>Para quem é</span><h2 id="audience-title">Para empresas que sabem que podem vender melhor.</h2><p>A metodologia Escala Growth é indicada para empresas que:</p></div>
            <ul className={styles.audienceGrid}>{audience.map(item => <li key={item}><span aria-hidden="true">→</span>{item}</li>)}</ul>
            <p className={styles.sectionConclusion}>Não é necessário possuir uma grande equipe ou uma estrutura tecnológica avançada. O diagnóstico considera o momento atual da empresa e indica uma evolução possível e realista.</p>
          </div>
        </section>

        <section className={styles.aboutSection} aria-labelledby="about-title">
          <div className={styles.sectionInner}>
            <div className={styles.aboutCopy}>
              <span className={styles.eyebrow}>Quem conduz a metodologia</span>
              <h2 id="about-title">Estratégia, tecnologia e experiência comercial trabalhando juntas.</h2>
              <p>A Escala Vendas atua na organização e evolução de operações comerciais por meio de processos, automação e Inteligência Artificial.</p>
              <p>Nossa metodologia une experiência em tecnologia, gestão de projetos e vendas consultivas para ajudar empresas a acompanhar melhor cada oportunidade e construir uma operação mais organizada, mensurável e preparada para crescer.</p>
            </div>
            <aside className={styles.consultantCard}>
              <span>TF</span><div><h3>Teófilo Oliveira Fagundes</h3><p>Especialista em consultoria para implantação de agentes de Inteligência Artificial e organização de operações comerciais.</p><strong>CEO da Escala Vendas</strong></div>
            </aside>
          </div>
        </section>

        <section id="faq" className={styles.faqSection} aria-labelledby="faq-title">
          <div className={styles.faqInner}>
            <div className={styles.sectionHeading}><span className={styles.eyebrow}>Perguntas frequentes</span><h2 id="faq-title">Dúvidas antes de começar?</h2></div>
            <div className={styles.faqList}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <div><span className={styles.eyebrowLight}>Comece pelo diagnóstico</span><h2 id="final-cta-title">Toda oportunidade conta.</h2><p>Descubra onde sua operação comercial está perdendo força e quais áreas precisam evoluir para sua empresa crescer com mais organização e previsibilidade.</p><Link className={styles.lightButton} href="/diagnostico">Fazer meu Diagnóstico Escala Growth</Link><small>O primeiro passo para vender melhor é entender como sua empresa vende hoje.</small></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div><strong>Escala Vendas LTDA</strong><p>CNPJ: 60.328.666/0001-03</p><p>Rua Marechal Deodoro, 450, sala 505<br />Centro · Curitiba – PR · CEP 80010-010</p></div>
          <div><strong>Contato</strong><a href="tel:+5541998134442">(41) 99813-4442</a><a href="https://www.escalavendas.com.br" target="_blank" rel="noopener noreferrer">www.escalavendas.com.br</a></div>
          <nav aria-label="Links do rodapé"><strong>Acesso</strong><Link href="/diagnostico">Diagnóstico</Link><Link href="/login">Área do cliente</Link></nav>
        </div>
        <p className={styles.copyright}>© {new Date().getFullYear()} Escala Vendas. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
