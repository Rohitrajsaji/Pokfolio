"use client";

import { projects } from "@content";
import type { Project } from "@content/types";
import { useState } from "react";
import { pokemonSpriteUrl } from "@/pokeapi/sprites";
import { sound } from "../../audio/sound";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";
import { groups } from "../paginate";
import { EntryName, MonSprite, TypeBadges, proseBlocks, usePreloadedImages } from "./parts";

const dexNumber = (index: number) => `No. ${String(index + 1).padStart(3, "0")}`;
const MASCOT_SPRITES = projects.map((project) => pokemonSpriteUrl(project.mascot.dex));

function DexEntry({ project, index }: { project: Project; index: number }) {
  const { mascot, links } = project;
  const blocks = [
    <div key="top" className="entry-top">
      <div className="entry-portrait">
        <MonSprite mon={mascot} />
      </div>
      <div>
        <p className="entry-kicker">
          {dexNumber(index)} · {mascot.name}
        </p>
        <EntryName>{project.name.toUpperCase()}</EntryName>
        <p className="entry-kind">{project.tagline}</p>
        <TypeBadges types={mascot.types} />
        {project.status && <p className="entry-status">STATUS · {project.status.toUpperCase()}</p>}
      </div>
    </div>,
    ...proseBlocks("summary", project.summary),
    ...project.highlights.map((highlight, i) => (
      <div key={highlight}>
        {i === 0 && <h4 className="section-title">{project.highlightsTitle.toUpperCase()}</h4>}
        <ul className="bullets readable">
          <li>{highlight}</li>
        </ul>
      </div>
    )),
    ...groups(project.tags, 6).map((tags) => (
      <ul key={tags.join()} className="chips" aria-label="Tags">
        {tags.map((tag) => (
          <li key={tag} className="chip">
            {tag}
          </li>
        ))}
      </ul>
    )),
  ];
  if (links && (links.github || links.demo)) {
    blocks.push(
      <div key="links" className="screen-actions">
        {links.github && (
          <a
            data-nav
            className="screen-button"
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            GITHUB
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
            LIVE DEMO
          </a>
        )}
      </div>,
    );
  }
  return (
    <article className="entry entry-fit" aria-label={project.name}>
      <Paged blocks={blocks} label={`${project.name} pages`} />
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
      fit
      initial={start}
      onSelect={(item) => {
        if (!item.dataset.index) return;
        const selected = Number(item.dataset.index);
        setIndex(selected);
        sound.cry(projects[selected].mascot.dex);
      }}
    >
      <div className="browse browse-fit">
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
                    <span className="browse-no">{String(i + 1).padStart(3, "0")}</span>
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
