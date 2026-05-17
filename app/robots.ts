import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas ou com tokens não devem ser indexadas.
      disallow: [
        "/dashboard",
        "/board",
        "/api/",
        "/verify-email",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
