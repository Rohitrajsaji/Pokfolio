"use client";

import { experience } from "@content";
import type { Job } from "@content/types";
import { useState } from "react";
import { formatRange } from "@/lib/dates";
import { partyIconUrl } from "@/pokeapi/sprites";
import { Sprite } from "@/ui/Sprite";
import { sound } from "../../audio/sound";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";
import { MonSprite, TypeBadges } from "./parts";

const KINDS: Readonly<Record<Job["kind"], string>> = {
  "full-time": "Full-time",
  internship: "Internship",
  training: "Training",
};

function JobEntry({ job }: { job: Job }) {
  const blocks = [
    <div key="top" className="entry-top">
      <div className="entry-portrait">
        <MonSprite mon={job.mascot} />
      </div>
      <div>
        <p className="entry-kicker">{job.mascot.name}</p>
        <h3 className="entry-name">{job.company.toUpperCase()}</h3>
        <p className="entry-kind">{job.role}</p>
        <TypeBadges types={job.mascot.types} />
      </div>
    </div>,
    <dl key="facts" className="facts">
      <dt>DATES</dt>
      <dd>{formatRange(job.start, job.end)}</dd>
      <dt>TYPE</dt>
      <dd>{KINDS[job.kind]}</dd>
      {job.location && (
        <>
          <dt>PLACE</dt>
          <dd>{job.location}</dd>
        </>
      )}
    </dl>,
    ...job.highlights.map((highlight, i) => (
      <div key={highlight}>
        {i === 0 && <h4 className="section-title">HIGHLIGHTS</h4>}
        <ul className="bullets readable">
          <li>{highlight}</li>
        </ul>
      </div>
    )),
  ];
  return (
    <article className="entry entry-fit" aria-label={job.company}>
      <Paged blocks={blocks} label={`${job.company} pages`} />
    </article>
  );
}

/** POKéMON: the career so far, one party slot per job, newest first. */
export function PartyScreen({ job }: { job?: string }) {
  const start = Math.max(
    0,
    experience.findIndex((entry) => entry.id === job),
  );
  const [index, setIndex] = useState(start);
  const current = experience[index];

  return (
    <ScreenFrame
      title="POKéMON"
      accent="#3f8f5a"
      fit
      initial={start}
      onSelect={(item) => {
        if (!item.dataset.index) return;
        const selected = Number(item.dataset.index);
        setIndex(selected);
        sound.cry(experience[selected].mascot.dex);
      }}
    >
      <div className="browse browse-fit">
        <div className="browse-side">
          <ol className="browse-list" aria-label="Career">
            {experience.map((entry, i) => (
              <li key={entry.id}>
                <button
                  type="button"
                  data-nav
                  data-index={i}
                  className="browse-item party-slot"
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                >
                  <Sprite
                    src={partyIconUrl(entry.mascot.dex)}
                    alt=""
                    size={40}
                    className="party-icon"
                  />
                  <span>
                    <span className="browse-name">{entry.company.toUpperCase()}</span>
                    <span className="browse-no">{formatRange(entry.start, entry.end)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <JobEntry key={current.id} job={current} />
      </div>
    </ScreenFrame>
  );
}
