"use client";

import { profile } from "@content";
import { useState } from "react";
import { useGame } from "../../state/store";
import { ScreenFrame } from "../ScreenFrame";
import { SCREEN_LINKS } from "./parts";

/** "https://github.com/someone" → "github.com/someone" */
const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

/** The POKéGEAR: every way to get in touch. */
export function ContactScreen() {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  return (
    <ScreenFrame title="POKéGEAR" accent="#2f6fb0">
      <div className="gear">
        <p className="gear-status">
          {profile.name.toUpperCase()} · {profile.role.toUpperCase()}
        </p>
        <ul className="gear-list">
          <li className="gear-row">
            <span className="gear-label">EMAIL</span>
            <a data-nav className="gear-value" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <button type="button" data-nav className="gear-action" onClick={copyEmail}>
              {copy === "copied" ? "COPIED!" : "COPY"}
            </button>
          </li>
          <li className="gear-row">
            <span className="gear-label">LINKEDIN</span>
            <a
              data-nav
              className="gear-value"
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortUrl(profile.links.linkedin)}
            </a>
          </li>
          <li className="gear-row">
            <span className="gear-label">GITHUB</span>
            <a
              data-nav
              className="gear-value"
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortUrl(profile.links.github)}
            </a>
          </li>
          <li className="gear-row">
            <span className="gear-label">RÉSUMÉ</span>
            <button
              type="button"
              data-nav
              className="gear-value"
              onClick={() => useGame.getState().pushScreen({ screen: "resume" })}
            >
              Open the full résumé
            </button>
          </li>
          <li className="gear-row">
            <span className="gear-label">BASED IN</span>
            <span className="gear-value">
              {profile.location} · {profile.relocation}
            </span>
          </li>
        </ul>
        <p className="sr-only" role="status">
          {copy === "copied" ? "Email address copied." : ""}
        </p>
        {copy === "failed" && (
          <p className="gear-note">
            Couldn&apos;t copy automatically. The address is {profile.email}.
          </p>
        )}
      </div>
      <div className="screen-actions">
        <button
          type="button"
          data-nav
          className="screen-button"
          onClick={() => useGame.getState().pushScreen({ screen: "jobs" })}
        >
          {SCREEN_LINKS.jobs}
        </button>
      </div>
    </ScreenFrame>
  );
}
