"use client";

import { dialogue, site } from "@content";
import { fill } from "../../text";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";
import { proseBlocks } from "./parts";

/** CREDITS: who made what, and the fan disclaimer. */
export function CreditsScreen() {
  const { link } = dialogue.credits;
  return (
    <ScreenFrame title="CREDITS" accent="#8a6236" fit>
      <Paged
        label="Credits pages"
        blocks={[
          ...dialogue.credits.lines.flatMap((line, i) => proseBlocks(`line-${i}`, fill(line))),
          ...proseBlocks("note", site.disclaimer, "Please note"),
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
