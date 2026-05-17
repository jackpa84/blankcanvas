import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Web App Manifest — torna o FreeDraw instalável como PWA.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — quadro branco online grátis`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    dir: "ltr",
    background_color: "#08080b",
    theme_color: "#08080b",
    categories: ["productivity", "graphics"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
