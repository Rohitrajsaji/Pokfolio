import { experience, profile, skills } from "@content";

/** schema.org Person data, so search engines and AI crawlers understand the page. */
export function personJsonLd(siteUrl: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    description: profile.summary[0],
    url: siteUrl.href,
    email: `mailto:${profile.email}`,
    homeLocation: { "@type": "Place", name: profile.location },
    worksFor: experience
      .filter((job) => job.end === "present")
      .map((job) => ({ "@type": "Organization", name: job.company })),
    alumniOf: profile.education.map((ed) => ({
      "@type": "CollegeOrUniversity",
      name: ed.institution,
    })),
    sameAs: [profile.links.linkedin, profile.links.github],
    knowsAbout: skills.flatMap((category) => category.skills),
  };
}

/** JSON for a `<script type="application/ld+json">` tag, with `<` escaped against XSS. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
