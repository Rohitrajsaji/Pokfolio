import { describe, expect, it } from "vitest";
import * as content from "./index";
import { experience, profile, projects, skills, site } from "./index";

/** Every string anywhere in the content, with the path where it lives. */
function collectStrings(value: unknown, path = "content"): Array<[string, string]> {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((item, i) => collectStrings(item, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => collectStrings(item, `${path}.${key}`));
  }
  return [];
}

const allStrings = collectStrings(content);
const urlPattern = /^https?:\/\//;
const yearMonth = /^\d{4}-(0[1-9]|1[0-2])$/;

describe("content", () => {
  it("never names the retail client (confidentiality)", () => {
    const offenders = allStrings.filter(([, text]) => /costco/i.test(text));
    expect(offenders).toEqual([]);
  });

  it("links to the confirmed GitHub profile", () => {
    expect(profile.links.github).toBe("https://github.com/rohitrajsaji");
  });

  it("has a valid email address", () => {
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("uses https for every URL", () => {
    const urls = allStrings.filter(([, text]) => urlPattern.test(text));
    expect(urls.length).toBeGreaterThan(0);
    for (const [path, url] of urls) {
      expect(() => new URL(url), path).not.toThrow();
      expect(url, path).toMatch(/^https:\/\//);
    }
  });

  it("has no stray whitespace or doubled spaces in text", () => {
    const offenders = allStrings.filter(([, text]) => text !== text.trim() || text.includes("  "));
    expect(offenders).toEqual([]);
  });

  it("has no empty strings or empty lists", () => {
    expect(allStrings.filter(([, text]) => text.length === 0)).toEqual([]);
    for (const project of projects) {
      expect(project.highlights.length, project.id).toBeGreaterThan(0);
      expect(project.tags.length, project.id).toBeGreaterThan(0);
    }
    for (const job of experience) expect(job.highlights.length, job.id).toBeGreaterThan(0);
    for (const category of skills) expect(category.skills.length, category.id).toBeGreaterThan(0);
  });

  it("has unique kebab-case ids", () => {
    const ids = [...experience, ...projects, ...skills].map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("uses YYYY-MM dates with start before end", () => {
    const ranges = [
      ...experience.map((job) => [job.id, job.start, job.end] as const),
      ...profile.education.map((ed) => [ed.degree, ed.start, ed.end] as const),
    ];
    for (const [label, start, end] of ranges) {
      expect(start, label).toMatch(yearMonth);
      if (end !== "present") {
        expect(end, label).toMatch(yearMonth);
        expect(start <= end, `${label}: ${start} → ${end}`).toBe(true);
      }
    }
  });

  it("lists experience most recent first", () => {
    const starts = experience.map((job) => job.start);
    expect([...starts].sort().reverse()).toEqual(starts);
  });

  it("references Pokémon that have animated sprites (#1–649)", () => {
    const mascots = [
      ...experience.map((job) => job.mascot),
      ...projects.map((project) => project.mascot),
      site.partner,
      site.wild,
    ];
    for (const mon of mascots) {
      expect(Number.isInteger(mon.dex), mon.name).toBe(true);
      expect(mon.dex, mon.name).toBeGreaterThanOrEqual(1);
      expect(mon.dex, mon.name).toBeLessThanOrEqual(649);
      expect(mon.name, mon.name).toBe(mon.name.toUpperCase());
    }
  });
});
