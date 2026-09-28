import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { experience, preferences, profile, projects, skills } from "@content";
import { formatRange } from "@/lib/dates";
import { getSiteUrl } from "@/lib/site-url";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "Résumé",
  description: `${profile.name}, ${profile.role} in ${profile.location}. ${profile.summary[0]}`,
  alternates: { canonical: "/resume" },
};

const KIND_LABELS = { "full-time": undefined, internship: "Internship", training: "Training" };

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10 print:mt-6">
      <h2 id={id} className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
        {title}
      </h2>
      <div className="mt-3 border-t border-line pt-4">{children}</div>
    </section>
  );
}

function EntryHeading({ title, meta, aside }: { title: string; meta?: string; aside?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <h3 className="font-semibold">
        {title}
        {meta && <span className="font-normal text-muted"> · {meta}</span>}
      </h3>
      {aside && <p className="text-sm text-muted tabular-nums">{aside}</p>}
    </div>
  );
}

const linkClass =
  "underline decoration-line underline-offset-4 transition hover:decoration-accent print:no-underline";

export default function ResumePage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <nav className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
          <Link
            href="/"
            className="font-pixel text-sm tracking-wide transition hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            ◀ Play the adventure
          </Link>
          <PrintButton />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-5 pt-10 pb-16 print:max-w-none print:p-0">
        <header>
          <h1 className="text-4xl font-bold tracking-tight">{profile.name}</h1>
          <p className="mt-1 text-lg text-muted">
            {profile.role} · {profile.focus}
          </p>
          <p className="mt-3 text-sm text-muted">
            {profile.location} · {profile.relocation}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <li>
              <a className={linkClass} href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </li>
            <li>
              <a className={linkClass} href={profile.links.linkedin}>
                {displayUrl(profile.links.linkedin)}
              </a>
            </li>
            <li>
              <a className={linkClass} href={profile.links.github}>
                {displayUrl(profile.links.github)}
              </a>
            </li>
          </ul>
        </header>

        <Section id="summary" title="Summary">
          <div className="space-y-3 leading-relaxed">
            {profile.summary.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Section>

        <Section id="experience" title="Experience">
          <div className="space-y-7">
            {experience.map((job) => (
              <article key={job.id} className="break-inside-avoid">
                <EntryHeading
                  title={job.role}
                  meta={job.company}
                  aside={formatRange(job.start, job.end)}
                />
                {(job.location || KIND_LABELS[job.kind]) && (
                  <p className="text-sm text-muted">
                    {[KIND_LABELS[job.kind], job.location].filter(Boolean).join(" · ")}
                  </p>
                )}
                <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed marker:text-muted">
                  {job.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section id="projects" title="Selected projects">
          <div className="space-y-8">
            {projects.map((project) => (
              <article key={project.id} className="break-inside-avoid">
                <EntryHeading title={project.name} meta={project.tagline} aside={project.status} />
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Technologies and topics">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-line bg-chip px-2.5 py-0.5 text-xs text-muted"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 leading-relaxed">{project.summary}</p>
                <p className="mt-3 text-sm font-medium text-muted">{project.highlightsTitle}</p>
                <ul className="mt-1 grid list-disc gap-x-8 gap-y-0.5 pl-5 marker:text-muted sm:grid-cols-2 print:grid-cols-2">
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                {(project.links?.github || project.links?.demo) && (
                  <p className="mt-2 flex gap-4 text-sm">
                    {project.links.github && (
                      <a className={linkClass} href={project.links.github}>
                        Source
                      </a>
                    )}
                    {project.links.demo && (
                      <a className={linkClass} href={project.links.demo}>
                        Live demo
                      </a>
                    )}
                  </p>
                )}
              </article>
            ))}
          </div>
        </Section>

        <Section id="skills" title="Technical skills">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr] print:grid-cols-[12rem_1fr]">
            {skills.map((category) => (
              <Fragment key={category.id}>
                <dt className="font-medium">{category.name}</dt>
                <dd className="-mt-2 leading-relaxed text-muted sm:mt-0 print:mt-0">
                  {category.skills.join(", ")}
                </dd>
              </Fragment>
            ))}
          </dl>
        </Section>

        <Section id="education" title="Education">
          <div className="space-y-4">
            {profile.education.map((ed) => (
              <article key={ed.degree + ed.institution} className="break-inside-avoid">
                <EntryHeading
                  title={`${ed.degree}, ${ed.field}`}
                  aside={formatRange(ed.start, ed.end)}
                />
                <p className="text-sm text-muted">
                  {ed.institution} · {ed.university}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="languages" title="Languages & certifications">
          <ul className="space-y-1">
            {profile.certifications.map((cert) => (
              <li key={cert.name}>
                <span className="font-medium">{cert.name}</span>
                <span className="text-muted"> · {cert.detail}</span>
              </li>
            ))}
            {profile.languages.map((language) => (
              <li key={language.name}>
                <span className="font-medium">{language.name}</span>
                <span className="text-muted"> · {language.level}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="open-to" title="Open to">
          <p className="leading-relaxed">{preferences.intro}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {preferences.roles.map((role) => (
              <li key={role} className="rounded-md border border-line bg-chip px-2.5 py-1 text-sm">
                {role}
              </li>
            ))}
          </ul>
        </Section>

        <footer className="mt-14 border-t border-line pt-5 text-sm text-muted">
          <p className="print:hidden">
            Prefer exploring?{" "}
            <Link className={linkClass} href="/">
              Play the Pokémon-style adventure
            </Link>
            .
          </p>
          <p className="hidden print:block">Interactive version: {displayUrl(getSiteUrl().href)}</p>
        </footer>
      </main>
    </div>
  );
}
