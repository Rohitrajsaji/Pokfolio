"use client";

import { profile } from "@content";
import { useState } from "react";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";

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
    <ScreenFrame title="POKéGEAR" accent="#2f6fb0" fit>
      <div className="gear fill">
        <Paged
          label="Contact pages"
          blocks={[
            <p key="status" className="gear-status">
              {profile.name.toUpperCase()} · {profile.role.toUpperCase()}
            </p>,
            <div key="email" className="gear-row">
              <span className="gear-label">EMAIL</span>
              <a data-nav className="gear-value" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              <button type="button" data-nav className="gear-action" onClick={copyEmail}>
                {copy === "copied" ? "COPIED!" : "COPY"}
              </button>
            </div>,
            <div key="linkedin" className="gear-row">
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
            </div>,
            <div key="github" className="gear-row">
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
            </div>,
            <div key="based" className="gear-row">
              <span className="gear-label">BASED IN</span>
              <span className="gear-value gear-plain">
                {profile.location} · {profile.relocation}
              </span>
            </div>,
            ...(copy === "failed"
              ? [
                  <p key="note" className="gear-note">
                    Couldn&apos;t copy automatically. The address is {profile.email}.
                  </p>,
                ]
              : []),
          ]}
        />
        <p className="sr-only" role="status">
          {copy === "copied" ? "Email address copied." : ""}
        </p>
      </div>
    </ScreenFrame>
  );
}
