/**
 * The site's public origin, used for canonical URLs, social cards and the
 * sitemap. Set NEXT_PUBLIC_SITE_URL once you have a custom domain; on Vercel
 * the production domain is picked up automatically.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}
