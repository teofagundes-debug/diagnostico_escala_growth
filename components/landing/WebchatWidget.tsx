"use client";

import { useEffect } from "react";
import styles from "./LandingPage.module.css";

const WIDGET_ID = "ra_wc_chatbot";
const SDK_ID = "ra_wc_chatbot_sdk";
const WIDGET_SLUG = "8lbVGMJTn9vu1u4obpiIWdF5ebvDZzcakbJm6DIK";
const SDK_URL = "https://sitewidget.net/chatbot-sdk.js";

export function WebchatWidget() {
  useEffect(() => {
    let widget = document.getElementById(WIDGET_ID);

    if (!widget) {
      widget = document.createElement("ra-chatbot-widget");
      widget.id = WIDGET_ID;
      widget.setAttribute("slug", WIDGET_SLUG);
      widget.setAttribute("tabindex", "-1");
      document.body.appendChild(widget);
    }

    if (!document.getElementById(SDK_ID)) {
      const script = document.createElement("script");
      script.id = SDK_ID;
      script.src = SDK_URL;
      script.async = true;
      script.addEventListener("error", () => {
        console.warn("O Webchat da Nimble não pôde ser carregado.");
      }, { once: true });
      document.body.appendChild(script);
    }

    return () => {
      document.getElementById(WIDGET_ID)?.remove();
    };
  }, []);


  return (
    <aside className={styles.contactCard} aria-labelledby="webchat-contact-title">
      <h3 id="webchat-contact-title">Fale com nossa equipe</h3>
      <p>Tem dúvidas sobre o diagnóstico ou quer entender como funciona a metodologia Escala Growth? Nossa equipe está pronta para ajudar.</p>
      <div className={styles.chatDirection} aria-label="Use o botão verde Converse conosco no canto inferior direito da página">
        <span aria-hidden="true">↘</span>
        <strong>Use o botão verde “Converse conosco” no canto inferior direito.</strong>
      </div>
    </aside>
  );
}
