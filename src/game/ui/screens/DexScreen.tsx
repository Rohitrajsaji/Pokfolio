"use client";

import { projects } from "@content";
import type { Project } from "@content/types";
import { useId, useState } from "react";
import { pokemonSpriteUrl } from "@/pokeapi/sprites";
import { ScreenFrame } from "../ScreenFrame";
import { MonSprite, TypeBadges, usePreloadedImages } from "./parts";

const dexNumber = (index: number) => `No. ${String(index + 1).padStart(3, "0")}`;
const MASCOT_SPRITES = projects.map((project) => pokemonSpriteUrl(project.mascot.dex));

function DexEntry({ project, index }: { project: Project; index: number }) {
  const nameId = useId();
  const { mascot, links } = project;
  return (
    <article className="entry" aria-labelledby={nameId}>
      <div className="entry-top">
        <div className="entry-portrait">
          <MonSprite mon={mascot} />
        </div>
        <div>
          <p className="entry-kicker">
            {dexNumber(index)} · {mascot.name}
          </p>
          <h3 id={nameId} className="entry-name">
            {project.name.toUpperCase()}
          </h3>
          <p className="entry-kind">{project.tagline}</p>
          <TypeBadges types={mascot.types} />
          {project.status && (
            <p className="entry-status">STATUS · {project.status.toUpperCase()}</p>
          )}
        </div>
      </div>
      <p className="readable">{project.summary}</p>
      <h4 className="section-title">{project.highlightsTitle.toUpperCase()}</h4>
      <ul className="bullets readable">
        {project.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      <ul className="chips" aria-label="Tags">
        {project.tags.map((tag) => (
          <li key={tag} className="chip">
            {tag}
          </li>
        ))}
      </ul>
      {links && (links.github || links.demo) && (
        <div className="screen-actions">
          {links.github && (
            <a
              data-nav
              className="screen-button"
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              GITHUB ↗
            </a>
          )}
          {links.demo && (
            <a
              data-nav
              className="screen-button"
              href={links.demo}
              target="_blank"
              rel="noopener noreferrer"
            >
              LIVE DEMO ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}

/** The POKéDEX: one entry per project, each with its mascot. */
export function DexScreen({ project }: { project?: string }) {
  const start = Math.max(
    0,
    projects.findIndex((entry) => entry.id === project),
  );
  const [index, setIndex] = useState(start);
  usePreloadedImages(MASCOT_SPRITES);

  return (
    <ScreenFrame
      title="POKéDEX"
      accent="#d94b4b"
      initial={start}
      onSelect={(item) => {
        if (item.dataset.index) setIndex(Number(item.dataset.index));
      }}
    >
      <div className="browse">
        <div className="browse-side">
          <ol className="browse-list" aria-label="Projects">
            {projects.map((entry, i) => (
              <li key={entry.id}>
                <button
                  type="button"
                  data-nav
                  data-index={i}
                  className="browse-item"
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                >
                  <span>
                    <span className="browse-no">{dexNumber(i)}</span>
                    <span className="browse-name">{entry.name.toUpperCase()}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <DexEntry key={projects[index].id} project={projects[index]} index={index} />
      </div>
    </ScreenFrame>
  );
}
