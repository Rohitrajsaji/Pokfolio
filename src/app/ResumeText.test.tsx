import { experience, profile, projects, skills } from "@content";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResumeText } from "./ResumeText";

/** The page's plain text, as a search engine or screen reader gets it. */
const html = renderToStaticMarkup(<ResumeText />);
const text = html
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, " ");

describe("ResumeText", () => {
  it("has the whole résumé as text, straight from the content files", () => {
    expect(text).toContain(profile.name);
    expect(text).toContain(profile.email);
    for (const job of experience) {
      expect(text).toContain(job.company);
      for (const highlight of job.highlights) expect(text).toContain(highlight);
    }
    for (const project of projects) expect(text).toContain(project.name);
    for (const category of skills) expect(text).toContain(category.skills.join(", "));
  });

  it("is real HTML structure: a heading for each section, and links you can follow", () => {
    expect(html).toMatch(/<h3 id="rt-experience">Experience<\/h3>/);
    expect(html).toContain(`href="mailto:${profile.email}"`);
    expect(html).toContain(`href="${profile.links.github}"`);
  });

  it("never names the retail client", () => {
    expect(text).not.toMatch(/costco/i);
  });
});
