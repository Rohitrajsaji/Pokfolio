"use client";

import { preferences, profile } from "@content";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";

/** The JOB BOARD: the roles Rohit is open to, pinned up a page at a time. */
export function JobsScreen() {
  return (
    <ScreenFrame title="JOB BOARD" accent="#8a6236" fit>
      <div className="board fill">
        <Paged
          wrap
          label="Job board pages"
          blocks={[
            <p key="intro" className="board-intro wide">
              {preferences.intro}
            </p>,
            ...preferences.roles.map((role) => (
              <div key={role} className="board-note">
                {role}
              </div>
            )),
            <p key="footer" className="board-footer wide">
              {profile.location} · {profile.relocation}
            </p>,
          ]}
        />
      </div>
    </ScreenFrame>
  );
}
