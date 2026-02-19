import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mission Control",
    short_name: "MissionControl",
    start_url: "/",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    icons: [
      {
        src: "/icon/claw-mc-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon/claw-mc-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
