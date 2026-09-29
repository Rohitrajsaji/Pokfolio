"use client";

import { experience, profile } from "@content";
import Link from "next/link";
import { formatRange, formatYearMonth } from "@/lib/dates";
import { useGame } from "../../state/store";
import { ScreenFrame } from "../ScreenFrame";
import { AvatarPortrait, SCREEN_LINKS } from "./parts";

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
  return (
    <ScreenFrame title="TRAINER CARD" accent="#c24f7d">
      <div className="trainer-card">
        <p className="card-top">
          <span>IDNo. {trainerId(profile.name)}</span>
          <span>{profile.name.toUpperCase()}</span>
        </p>
        <div className="card-body">
          <dl className="card-facts">
            {FACTS.map(([label, value], index) => (
              <div key={index} className="card-fact">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <AvatarPortrait className="card-portrait" />
        </div>
      </div>
      <h3 className="section-title">ABOUT</h3>
      {profile.summary.map((paragraph, index) => (
        <p key={index} className="readable paragraph">
          {paragraph}
        </p>
      ))}
      <div className="screen-actions">
        <button
          type="button"
          data-nav
          className="screen-button"
          onClick={() => useGame.getState().pushScreen({ screen: "contact" })}
        >
          ▶ {SCREEN_LINKS.contact}
        </button>
        <Link data-nav href="/resume" className="screen-button">
          ▶ {SCREEN_LINKS.resume}
        </Link>
      </div>
    </ScreenFrame>
  );
}
