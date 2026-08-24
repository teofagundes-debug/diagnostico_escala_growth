"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./AcquisitionLanding.module.css";
import {AttributionDiagnosticLink} from "./CampaignAttributionClient";

const examples = [
  {
    title: "Seu estágio atual",
    text: "Veja seu Índice Escala Growth, o nível atual da operação, sua maior força e o principal gargalo identificado.",
    src: "/images/diagnostico-escala-growth/estagio-atual.png",
    alt: "Exemplo do resultado do Diagnóstico Escala Growth mostrando IEG, nível da operação, maior força e principal gargalo.",
    width: 1180,
    height: 764,
  },
  {
    title: "O que merece sua atenção",
    text: "Entenda o impacto dos principais gargalos, receba recomendações e visualize a direção de evolução da sua operação.",
    src: "/images/diagnostico-escala-growth/atencao-e-evolucao.png",
    alt: "Exemplo de recomendações do Diagnóstico Escala Growth com prioridades e direção de evolução.",
    width: 963,
    height: 912,
  },
  {
    title: "Por onde começar",
    text: "Transforme a análise em ações práticas, com uma visão organizada dos próximos passos para começar a evoluir sua operação.",
    src: "/images/diagnostico-escala-growth/plano-dinamico.png",
    alt: "Exemplo de plano dinâmico do Diagnóstico Escala Growth com próximos passos organizados.",
    width: 959,
    height: 726,
  },
] as const;

type Example = (typeof examples)[number];

export function DiagnosticResultShowcase() {
  const [expanded, setExpanded] = useState<Example | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  return (
    <section className={styles.showcaseSection} aria-labelledby="showcase-title">
      <div className={styles.inner}>
        <div className={styles.showcaseIntro} data-reveal>
          <span className={styles.eyebrow}>Veja o que você recebe</span>
          <h2 id="showcase-title">Não é apenas uma pontuação.<br />É uma leitura da sua operação.</h2>
          <p>Assim que você conclui o Diagnóstico Escala Growth, sua análise fica disponível online para consulta e impressão, mostrando onde sua operação está, o que merece atenção e quais pontos devem ganhar prioridade.</p>
          <small>Exemplo de resultado do Diagnóstico Escala Growth</small>
        </div>

        <div className={styles.showcaseList}>
          {examples.map((example, index) => (
            <article className={styles.showcaseItem} data-reveal key={example.title}>
              <div className={styles.showcaseCopy}>
                <span>0{index + 1}</span>
                <h3>{example.title}</h3>
                <p>{example.text}</p>
              </div>
              <button className={styles.screenshotButton} type="button" onClick={() => setExpanded(example)} aria-label={`Ampliar: ${example.title}`}>
                <Image src={example.src} alt={example.alt} width={example.width} height={example.height} sizes="(max-width: 820px) 94vw, 58vw" />
                <small>Clique para ampliar</small>
              </button>
            </article>
          ))}
        </div>

        <div className={styles.showcaseCta} data-reveal>
          <h3>Seu diagnóstico fica disponível online assim que você conclui.</h3>
          <p>Consulte, imprima e utilize as informações para entender melhor onde sua operação precisa evoluir.</p>
          <AttributionDiagnosticLink className={styles.primaryButton}>Fazer meu Diagnóstico Escala Growth</AttributionDiagnosticLink>
          <small>Resultado online e disponível imediatamente após a conclusão.</small>
        </div>
      </div>

      {expanded && (
        <div className={styles.lightbox} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setExpanded(null);
        }}>
          <div className={styles.lightboxDialog} role="dialog" aria-modal="true" aria-label={`Visualização ampliada: ${expanded.title}`}>
            <button className={styles.lightboxClose} type="button" onClick={() => setExpanded(null)} autoFocus aria-label="Fechar visualização ampliada">×</button>
            <Image src={expanded.src} alt={expanded.alt} width={expanded.width} height={expanded.height} sizes="96vw" priority />
          </div>
        </div>
      )}
    </section>
  );
}
