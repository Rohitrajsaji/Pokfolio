import { Fragment } from "react";
import { experience, preferences, profile, projects, skills } from "@content";
import { formatRange } from "@/lib/dates";
import { getSiteUrl } from "@/lib/site-url";

const KIND_LABELS = { "full-time": undefined, internship: "Internship", training: "Training" };

const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/**
 * The résumé as plain text on the page. On screen it's hidden from the eye,
 * but search engines and screen readers read it; when printed, it's the whole
 * page (the game is hidden), so the game's PRINT button prints this.
 */
export function ResumeText() {
  return (
    <article className="resume-text" aria-label={`${profile.name}: résumé`}>
      <header>
        <h2>{profile.name}</h2>
        <p>
          {profile.role} · {profile.focus}
        </p>
        <p>
          {profile.location} · {profile.relocation}
        </p>
        <ul className="resume-contact">
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          <li>
            <a href={profile.links.linkedin}>{displayUrl(profile.links.linkedin)}</a>
          </li>
          <li>
            <a href={profile.links.github}>{displayUrl(profile.links.github)}</a>
          </li>
        </ul>
      </header>

      <section aria-labelledby="rt-summary">
        <h3 id="rt-summary">Summary</h3>
        {profile.summary.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section aria-labelledby="rt-experience">
        <h3 id="rt-experience">Experience</h3>
        {experience.map((job) => (
          <article key={job.id}>
            <h4>
              {job.role}, {job.company}
            </h4>
            <p className="resume-meta">
              {[formatRange(job.start, job.end), KIND_LABELS[job.kind], job.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <ul>
              {job.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section aria-labelledby="rt-projects">
        <h3 id="rt-projects">Selected projects</h3>
        {projects.map((project) => (
          <article key={project.id}>
            <h4>
              {project.name}: {project.tagline}
            </h4>
            {project.status && <p className="resume-meta">{project.status}</p>}
            <p>{project.summary}</p>
            <p className="resume-meta">{project.highlightsTitle}</p>
            <ul>
              {project.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <p className="resume-meta">Technologies and topics: {project.tags.join(", ")}</p>
            {(project.links?.github || project.links?.demo) && (
              <p>
                {project.links.github && <a href={project.links.github}>Source</a>}{" "}
                {project.links.demo && <a href={project.links.demo}>Live demo</a>}
              </p>
            )}
          </article>
        ))}
      </section>

      <section aria-labelledby="rt-skills">
        <h3 id="rt-skills">Technical skills</h3>
        <dl>
          {skills.map((category) => (
            <Fragment key={category.id}>
              <dt>{category.name}</dt>
              <dd>{category.skills.join(", ")}</dd>
            </Fragment>
          ))}
        </dl>
      </section>

      <section aria-labelledby="rt-education">
        <h3 id="rt-education">Education</h3>
        {profile.education.map((ed) => (
          <article key={ed.degree + ed.institution}>
            <h4>
              {ed.degree}, {ed.field}
            </h4>
            <p className="resume-meta">
              {ed.institution} · {ed.university} · {formatRange(ed.start, ed.end)}
            </p>
          </article>
        ))}
      </section>

      <section aria-labelledby="rt-more">
        <h3 id="rt-more">Languages and certifications</h3>
        <ul>
          {profile.certifications.map((cert) => (
            <li key={cert.name}>
              {cert.name} · {cert.detail}
            </li>
          ))}
          {profile.languages.map((language) => (
            <li key={language.name}>
              {language.name} · {language.level}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rt-open">
        <h3 id="rt-open">Open to</h3>
        <p>{preferences.intro}</p>
        <ul>
          {preferences.roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </section>

      <p className="resume-meta resume-footer">
        Interactive version: {displayUrl(getSiteUrl().href)}
      </p>
    </article>
  );
}
