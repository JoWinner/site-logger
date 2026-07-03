import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Site Logger Attendance",
    short_name: "Site Logger",
    description: "GPS-evidenced QR attendance for construction sites.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f1ecdf",
    theme_color: "#173f35",
    orientation: "any",
    icons: [
      {
        src: "/icons/site-logger-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/site-logger-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
