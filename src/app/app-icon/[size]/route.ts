import { encodePng } from "@/art/png";
import { scaleBuffer } from "@/art/scale";
import { iconArt } from "@/lib/cards";

export const dynamic = "force-static";

/** The sizes the app manifest asks for, drawn from the same portrait as the favicon. */
const SIZES = [192, 512];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  const png = encodePng(scaleBuffer(iconArt(false), size / 16));
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}
