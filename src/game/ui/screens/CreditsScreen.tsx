"use client";

import { dialogue, site } from "@content";
import { fill } from "../../text";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";

/** CREDITS: who made what, and the fan disclaimer. */
export function CreditsScreen() {
  const { link } = dialogue.credits;
  return (
    <ScreenFrame title="CREDITS" accent="#8a6236" fit>
      <Paged
        label="Credits pages"
        blocks={[
          ...dialogue.credits.lines.map((line) => (
            <p key={line} className="readable">
              {fill(line)}
            </p>
          )),
          <div key="note">
            <h3 className="section-title">Please note</h3>
            <p className="readable">{site.disclaimer}</p>
          </div>,
          <div key="link" className="screen-actions">
            <a
              data-nav
              className="screen-button"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          </div>,
        ]}
      />
    </ScreenFrame>
  );
}
