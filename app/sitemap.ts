import type { MetadataRoute } from "next";

const SITE_URL = "https://www.escalavendas.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/diagnostico`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/escala-growth`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
