"use client";

import { preferences, profile } from "@content";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useGame } from "../../state/store";
import { ScreenFrame } from "../ScreenFrame";
import { SCREEN_LINKS } from "./parts";

/** A few tilts, so the pinned notes don't look machine-placed. */
const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5];

/** The JOB BOARD: the roles Rohit is open to. */
export function JobsScreen() {
  return (
    <ScreenFrame title="JOB BOARD" accent="#8a6236">
      <div className="board">
        <p className="board-intro">{preferences.intro}</p>
        <ul className="board-notes">
          {preferences.roles.map((role, index) => (
            <li
              key={role}
              className="board-note"
              style={{ "--tilt": `${TILTS[index % TILTS.length]}deg` } as CSSProperties}
            >
              {role}
            </li>
          ))}
        </ul>
        <p className="board-footer">
          {profile.location} · {profile.relocation}
        </p>
      </div>
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
