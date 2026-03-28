import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Medit Streak",
    short_name: "Medit Streak",
    description: "Meditation timer and streak tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f243d",
    theme_color: "#0f243d",
    lang: "es-ES",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
