"use client";

import { experience, preferences, profile, projects, skills } from "@content";
import { useRef, useState } from "react";
import { formatRange } from "@/lib/dates";
import type { Action } from "../../engine/input";
import { ScreenFrame } from "../ScreenFrame";

const TABS = [
  { id: "summary", label: "SUMMARY" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "projects", label: "PROJECTS" },
  { id: "skills", label: "SKILLS" },
  { id: "education", label: "EDUCATION" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const KIND_LABELS = { "full-time": undefined, internship: "Internship", training: "Training" };

/** "https://github.com/someone" → "github.com/someone" */
const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Summary() {
  return (
    <>
      <p className="entry-name">{profile.name.toUpperCase()}</p>
      <p className="res-meta">
        {profile.role} · {profile.focus}
      </p>
      <p className="res-meta">
        {profile.location} · {profile.relocation}
      </p>
      <h3 className="section-title">Summary</h3>
      {profile.summary.map((paragraph) => (
        <p key={paragraph} className="readable paragraph">
          {paragraph}
        </p>
      ))}
      <h3 className="section-title">Contact</h3>
      <ul className="res-links">
        <li>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        <li>
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
            {shortUrl(profile.links.linkedin)}
          </a>
        </li>
        <li>
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer">
            {shortUrl(profile.links.github)}
          </a>
        </li>
      </ul>
      <h3 className="section-title">Open to</h3>
      <p className="readable">{preferences.intro}</p>
      <ul className="chips">
        {preferences.roles.map((role) => (
          <li key={role} className="chip">
            {role}
          </li>
        ))}
      </ul>
    </>
  );
}

function Experience() {
  return (
    <>
      {experience.map((job) => (
        <article key={job.id} className="res-entry">
          <h3 className="section-title">{job.company}</h3>
          <p className="res-title">{job.role}</p>
          <p className="res-meta">
            {[formatRange(job.start, job.end), KIND_LABELS[job.kind], job.location]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <ul className="bullets readable">
            {job.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </article>
      ))}
    </>
  );
}

function Projects() {
  return (
    <>
      {projects.map((project) => (
        <article key={project.id} className="res-entry">
          <h3 className="section-title">{project.name}</h3>
          <p className="res-title">{project.tagline}</p>
          {project.status && <p className="res-meta">{project.status}</p>}
          <p className="readable res-body">{project.summary}</p>
          <p className="res-meta">{project.highlightsTitle}</p>
          <ul className="bullets readable">
            {project.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <ul className="chips" aria-label="Technologies and topics">
            {project.tags.map((tag) => (
              <li key={tag} className="chip">
                {tag}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </>
  );
}

function Skills() {
  return (
    <>
      {skills.map((category) => (
        <article key={category.id} className="res-entry">
          <h3 className="section-title">{category.name}</h3>
          <ul className="chips res-chips">
            {category.skills.map((skill) => (
              <li key={skill} className="chip">
                {skill}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </>
  );
}

function Education() {
  return (
    <>
      {profile.education.map((ed) => (
        <article key={ed.degree + ed.institution} className="res-entry">
          <h3 className="section-title">{formatRange(ed.start, ed.end)}</h3>
          <p className="res-title">
            {ed.degree}, {ed.field}
          </p>
          <p className="res-meta">
            {ed.institution} · {ed.university}
          </p>
        </article>
      ))}
      <h3 className="section-title">Certifications</h3>
      <ul className="bullets readable">
        {profile.certifications.map((cert) => (
          <li key={cert.name}>
            {cert.name} · {cert.detail}
          </li>
        ))}
      </ul>
      <h3 className="section-title">Languages</h3>
      <ul className="bullets readable">
        {profile.languages.map((language) => (
          <li key={language.name}>
            {language.name} · {language.level}
          </li>
        ))}
      </ul>
    </>
  );
}

const PANELS: Record<TabId, () => React.JSX.Element> = {
  summary: Summary,
  experience: Experience,
  projects: Projects,
  skills: Skills,
  education: Education,
};

/**
 * The whole résumé, in the game: a tab for each section. Left and right move
 * along the tabs, up and down scroll, and PRINT makes a clean page (the
 * browser's print dialog, where it can be saved as a PDF).
 */
export function ResumeScreen() {
  const [tab, setTab] = useState<TabId>("summary");
  const tabs = useRef<HTMLDivElement>(null);
  const Panel = PANELS[tab];

  const scroller = () => tabs.current?.closest<HTMLElement>(".px-scroll-body") ?? null;

  const onKey = (action: Action) => {
    const row = tabs.current;
    if (!row) return false;
    if (action === "left" || action === "right") {
      const items = [...row.querySelectorAll<HTMLElement>("[data-nav]")];
      const at = items.findIndex((item) => item.hasAttribute("data-current"));
      const step = action === "left" ? -1 : 1;
      items[(at + step + items.length) % items.length]?.focus({ preventScroll: true });
      return true;
    }
    if (action === "up" || action === "down") {
      const el = scroller();
      if (el) {
        const unit = Number.parseFloat(getComputedStyle(el).getPropertyValue("--px")) || 1;
        el.scrollBy({ top: (action === "up" ? -36 : 36) * unit });
      }
      return true;
    }
    return false;
  };

  const show = (id: TabId) => {
    setTab(id);
    const el = scroller();
    if (el) el.scrollTop = 0;
  };

  return (
    <ScreenFrame
      title="RÉSUMÉ"
      accent="#2f6fb0"
      onKey={onKey}
      onSelect={(item) => {
        const id = item.dataset.tab as TabId | undefined;
        if (id && id !== tab) show(id);
      }}
    >
      <div ref={tabs} className="res-tabs" role="tablist" aria-label="Résumé sections">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            data-nav
            data-tab={id}
            className="tab"
            onClick={() => show(id)}
          >
            {label}
          </button>
        ))}
        <button type="button" data-nav className="tab tab-print" onClick={() => window.print()}>
          PRINT
        </button>
      </div>
      <div className="res-panel" role="tabpanel">
        <Panel />
      </div>
    </ScreenFrame>
  );
}
