import type { MetadataRoute } from "next";

const SITE_URL = "https://www.escalavendas.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/portal",
        "/central",
        "/admin",
        "/api",
        "/consultoria",
        "/definir-senha",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
