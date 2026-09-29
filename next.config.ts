import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * What the page may load. Everything is the site's own, except the official sprites and cries, which
 * come from PokeAPI's repository on GitHub (see src/pokeapi/sprites.ts). The page is static, so scripts
 * can't carry a per-request nonce: inline ones are allowed, but nothing from anywhere else is, and the
 * page can't be put in a frame, submit a form elsewhere, or load plugins.
 */
const POKEAPI = "https://raw.githubusercontent.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${POKEAPI}`,
  `connect-src 'self' ${POKEAPI}${isDev ? " ws: wss:" : ""}`,
  "font-src 'self'",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev
    ? []
    : [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Official sprites are hotlinked from PokeAPI (see src/pokeapi/sprites.ts).
    remotePatterns: [new URL("https://raw.githubusercontent.com/PokeAPI/**")],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
