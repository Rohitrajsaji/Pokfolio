import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpriteGallery } from "./sprite-gallery";

export const metadata: Metadata = {
  title: "Art kit preview",
  robots: { index: false, follow: false },
};

/** Development-only preview of every tile, building, character and room. */
export default function SpritesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SpriteGallery />;
}
