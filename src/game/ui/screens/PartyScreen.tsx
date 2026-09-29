"use client";

import { experience } from "@content";
import type { Job } from "@content/types";
import { useId, useState } from "react";
import { formatRange } from "@/lib/dates";
import { useGame } from "../../state/store";
import { ScreenFrame } from "../ScreenFrame";
import { MonSprite, SCREEN_LINKS, TypeBadges } from "./parts";

const KINDS: Readonly<Record<Job["kind"], string>> = {
  "full-time": "Full-time",
  internship: "Internship",
  training: "Training",
};

function JobEntry({ job }: { job: Job }) {
  const nameId = useId();
  return (
    <article className="entry" aria-labelledby={nameId}>
      <div className="entry-top">
        <div className="entry-portrait">
          <MonSprite mon={job.mascot} />
        </div>
        <div>
          <p className="entry-kicker">{job.mascot.name}</p>
          <h3 id={nameId} className="entry-name">
            {job.company.toUpperCase()}
          </h3>
          <p className="entry-kind">{job.role}</p>
          <TypeBadges types={job.mascot.types} />
        </div>
      </div>
      <dl className="facts">
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
      </dl>
      <h4 className="section-title">HIGHLIGHTS</h4>
      <ul className="bullets readable">
        {job.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
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
      initial={start}
      onSelect={(item) => {
        if (item.dataset.index) setIndex(Number(item.dataset.index));
      }}
    >
      <div className="browse">
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
                  <MonSprite mon={entry.mascot} decorative className="party-icon" />
                  <span>
                    <span className="browse-name">{entry.company.toUpperCase()}</span>
                    <span className="browse-no">{formatRange(entry.start, entry.end)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            data-nav
            className="screen-button browse-extra"
            onClick={() => useGame.getState().pushScreen({ screen: "evolution" })}
          >
            ▶ {SCREEN_LINKS.evolution}
          </button>
        </div>
        <JobEntry key={current.id} job={current} />
      </div>
    </ScreenFrame>
  );
}
