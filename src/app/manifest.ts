import type { MetadataRoute } from "next";
import { profile, site } from "@content";

/** So the site can be added to a home screen and open full-screen, like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.title,
    short_name: profile.shortName,
    description: site.description,
    start_url: "/",
    display: "fullscreen",
    orientation: "any",
    background_color: "#000000",
    theme_color: "#10131f",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
