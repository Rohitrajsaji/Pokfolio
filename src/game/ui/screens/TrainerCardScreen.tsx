"use client";

import { experience, profile } from "@content";
import { formatRange, formatYearMonth } from "@/lib/dates";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";
import { AvatarPortrait } from "./parts";

/** A five-digit trainer ID worked out from the name, so it never changes. */
export function trainerId(name: string): string {
  let hash = 7;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 100_000;
  return String(hash).padStart(5, "0");
}

/** The first job's start date: when the adventure began. */
const started = experience
  .map((job) => job.start)
  .sort()
  .at(0);

const FACTS: ReadonlyArray<readonly [string, string]> = [
  ["ROLE", `${profile.role} · ${profile.focus}`],
  ["HOMETOWN", profile.location],
  ["TRAVEL", profile.relocation],
  ...profile.education.map(
    (school) =>
      [
        "SCHOOL",
        `${school.degree}, ${school.field} · ${school.institution} (${formatRange(school.start, school.end)})`,
      ] as const,
  ),
  ...profile.languages.map(
    (language) => ["LANGUAGE", `${language.name} · ${language.level}`] as const,
  ),
  ...profile.certifications.map((cert) => ["CERTIFIED", `${cert.name} · ${cert.detail}`] as const),
  ...(started ? [["ADVENTURE STARTED", formatYearMonth(started)] as const] : []),
];

/** The TRAINER CARD: who Rohit is, at a glance. */
export function TrainerCardScreen() {
  // The first few facts sit beside the portrait; the rest each take their own place in the pages.
  const beside = FACTS.slice(0, 3);
  const facts = FACTS.slice(3);
  const blocks = [
    <div key="head" className="card-head">
      <div className="trainer-card">
        <p className="card-top">
          <span>IDNo. {trainerId(profile.name)}</span>
          <span>{profile.name.toUpperCase()}</span>
        </p>
        <div className="card-body">
          <dl className="card-facts">
            {beside.map(([label, value]) => (
              <div key={label} className="card-fact">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <AvatarPortrait className="card-portrait" />
        </div>
      </div>
    </div>,
    ...facts.map(([label, value], index) => (
      <dl key={index} className="card-facts">
        <div className="card-fact">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      </dl>
    )),
    ...profile.summary.map((paragraph, index) => (
      <div key={paragraph}>
        {index === 0 && <h3 className="section-title">ABOUT</h3>}
        <p className="readable">{paragraph}</p>
      </div>
    )),
  ];
  return (
    <ScreenFrame title="TRAINER CARD" accent="#c24f7d" fit>
      <Paged blocks={blocks} label="Trainer card pages" />
    </ScreenFrame>
  );
}
