"use client";
import { useId, useState } from "react";
import styles from "./LandingPage.module.css";

export function InstitutionalFaq({ items }: { items: string[][] }) {
  const prefix = useId();
  const [open, setOpen] = useState<number | null>(null);
  return <div className={styles.faqList} data-reveal-group="faq">{items.map(([question, answer], index) => {
    const expanded = open === index;
    const panelId = `${prefix}-panel-${index}`;
    const buttonId = `${prefix}-button-${index}`;
    return <article className={expanded ? styles.faqOpen : ""} key={question}><h3><button id={buttonId} type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpen(expanded ? null : index)}>{question}<span aria-hidden="true">+</span></button></h3><div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded}><p>{answer}</p></div></article>;
  })}</div>;
}
