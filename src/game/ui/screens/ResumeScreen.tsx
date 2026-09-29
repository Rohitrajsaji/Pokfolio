"use client";

import { experience, preferences, profile, projects, skills } from "@content";
import { useRef, useState, type ReactNode } from "react";
import { formatRange } from "@/lib/dates";
import type { Action } from "../../engine/input";
import { Paged } from "../Paged";
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

/** What each tab shows, as blocks: the pages break between them, never in the middle of one. */
function summaryBlocks(): ReactNode[] {
  return [
    <div key="head">
      <p className="entry-name">{profile.name.toUpperCase()}</p>
      <p className="res-meta">
        {profile.role} · {profile.focus}
      </p>
      <p className="res-meta">
        {profile.location} · {profile.relocation}
      </p>
    </div>,
    ...profile.summary.map((paragraph, i) => (
      <div key={paragraph}>
        {i === 0 && <h3 className="section-title">Summary</h3>}
        <p className="readable">{paragraph}</p>
      </div>
    )),
    <div key="contact">
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
    </div>,
    <div key="open">
      <h3 className="section-title">Open to</h3>
      <p className="readable">{preferences.intro}</p>
    </div>,
    <ul key="roles" className="chips">
      {preferences.roles.map((role) => (
        <li key={role} className="chip">
          {role}
        </li>
      ))}
    </ul>,
  ];
}

function experienceBlocks(): ReactNode[] {
  return experience.flatMap((job) => [
    <div key={job.id}>
      <h3 className="section-title">{job.company}</h3>
      <p className="res-title">{job.role}</p>
      <p className="res-meta">
        {[formatRange(job.start, job.end), KIND_LABELS[job.kind], job.location]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>,
    ...job.highlights.map((highlight) => (
      <ul key={job.id + highlight} className="bullets readable">
        <li>{highlight}</li>
      </ul>
    )),
  ]);
}

function projectBlocks(): ReactNode[] {
  return projects.flatMap((project) => [
    <div key={project.id}>
      <h3 className="section-title">{project.name}</h3>
      <p className="res-title">{project.tagline}</p>
      {project.status && <p className="res-meta">{project.status}</p>}
    </div>,
    <p key={project.id + "summary"} className="readable res-body">
      {project.summary}
    </p>,
    ...project.highlights.map((highlight, i) => (
      <div key={project.id + highlight}>
        {i === 0 && <p className="res-meta">{project.highlightsTitle}</p>}
        <ul className="bullets readable">
          <li>{highlight}</li>
        </ul>
      </div>
    )),
    <ul key={project.id + "tags"} className="chips" aria-label="Technologies and topics">
      {project.tags.map((tag) => (
        <li key={tag} className="chip">
          {tag}
        </li>
      ))}
    </ul>,
  ]);
}

function skillBlocks(): ReactNode[] {
  return skills.map((category) => (
    <div key={category.id}>
      <h3 className="section-title">{category.name}</h3>
      <ul className="chips res-chips">
        {category.skills.map((skill) => (
          <li key={skill} className="chip">
            {skill}
          </li>
        ))}
      </ul>
    </div>
  ));
}

function educationBlocks(): ReactNode[] {
  return [
    ...profile.education.map((ed) => (
      <div key={ed.degree + ed.institution}>
        <h3 className="section-title">{formatRange(ed.start, ed.end)}</h3>
        <p className="res-title">
          {ed.degree}, {ed.field}
        </p>
        <p className="res-meta">
          {ed.institution} · {ed.university}
        </p>
      </div>
    )),
    <div key="certs">
      <h3 className="section-title">Certifications</h3>
      <ul className="bullets readable">
        {profile.certifications.map((cert) => (
          <li key={cert.name}>
            {cert.name} · {cert.detail}
          </li>
        ))}
      </ul>
    </div>,
    <div key="languages">
      <h3 className="section-title">Languages</h3>
      <ul className="bullets readable">
        {profile.languages.map((language) => (
          <li key={language.name}>
            {language.name} · {language.level}
          </li>
        ))}
      </ul>
    </div>,
  ];
}

const PANELS: Record<TabId, () => ReactNode[]> = {
  summary: summaryBlocks,
  experience: experienceBlocks,
  projects: projectBlocks,
  skills: skillBlocks,
  education: educationBlocks,
};

/**
 * The whole résumé, in the game: a tab for each section. Left and right move
 * along the tabs, up and down scroll, and PRINT makes a clean page (the
 * browser's print dialog, where it can be saved as a PDF).
 */
export function ResumeScreen() {
  const [tab, setTab] = useState<TabId>("summary");
  const tabs = useRef<HTMLDivElement>(null);

  const onKey = (action: Action) => {
    const row = tabs.current;
    if (!row) return false;
    const frame = row.closest<HTMLElement>(".screen-frame");
    const bar = frame?.querySelector<HTMLElement>(".paged-bar");
    const inBar = Boolean(bar && bar.contains(document.activeElement));
    const buttons = bar ? [...bar.querySelectorAll<HTMLElement>("button")] : [];
    if (action === "left" || action === "right") {
      // In the page bar, left and right turn the page; on the tabs they move along them.
      if (inBar) {
        buttons[action === "left" ? 0 : buttons.length - 1]?.click();
        return true;
      }
      const items = [...row.querySelectorAll<HTMLElement>("[data-nav]")];
      const at = items.findIndex((item) => item.hasAttribute("data-current"));
      const step = action === "left" ? -1 : 1;
      items[(at + step + items.length) % items.length]?.focus({ preventScroll: true });
      return true;
    }
    if (action === "up" || action === "down") {
      // Up and down go between the tabs and the page bar (when there is one).
      if (inBar) {
        row.querySelector<HTMLElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
      } else if (buttons.length > 0) {
        buttons[buttons.length - 1].focus({ preventScroll: true });
      }
      return true;
    }
    return false;
  };

  return (
    <ScreenFrame
      title="RÉSUMÉ"
      accent="#2f6fb0"
      fit
      onKey={onKey}
      onSelect={(item) => {
        const id = item.dataset.tab as TabId | undefined;
        if (id && id !== tab) setTab(id);
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
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <button type="button" data-nav className="tab tab-print" onClick={() => window.print()}>
          PRINT
        </button>
      </div>
      <div className="res-panel res-fit" role="tabpanel">
        <Paged key={tab} blocks={PANELS[tab]()} label="Résumé pages" />
      </div>
    </ScreenFrame>
  );
}
