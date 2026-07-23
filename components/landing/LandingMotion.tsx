"use client";

import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing-page]");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const groupedItems = root.querySelectorAll<HTMLElement>("[data-reveal-group] > *");
    groupedItems.forEach((item, index) => {
      item.dataset.reveal = "";
      item.style.setProperty("--reveal-delay", `${(index % 6) * 55}ms`);
    });

    const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!items.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const item = entry.target as HTMLElement;
          item.dataset.visible = "true";
          observer.unobserve(item);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    items.forEach(item => observer.observe(item));
    const frame = window.requestAnimationFrame(() => {
      root.dataset.motionReady = "true";
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return null;
}
