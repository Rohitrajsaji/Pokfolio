import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("getSiteUrl", () => {
  it("prefers an explicit NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://rohit.dev");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "rohit.vercel.app");
    expect(getSiteUrl().href).toBe("https://rohit.dev/");
  });

  it("falls back to the Vercel production domain", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "rohit.vercel.app");
    expect(getSiteUrl().href).toBe("https://rohit.vercel.app/");
  });

  it("uses localhost during local development", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(getSiteUrl().href).toBe("http://localhost:3000/");
  });
});
