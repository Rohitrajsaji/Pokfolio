"use client";

import { dialogue } from "@content";
import { useGame } from "../../state/store";
import { fill } from "../../text";
import { ScreenFrame } from "../ScreenFrame";

/** HELP: what the buttons do, and a few tips. */
export function HelpScreen() {
  return (
    <ScreenFrame title="HELP" accent="#5a6bc4">
      <h3 className="section-title">Controls</h3>
      <dl className="facts">
        {dialogue.help.controls.map(([button, does]) => (
          <div key={button} className="facts-row">
            <dt>{button}</dt>
            <dd>{does}</dd>
          </div>
        ))}
      </dl>
      <h3 className="section-title">Tips</h3>
      <ul className="bullets readable">
        {dialogue.help.tips.map((tip) => (
          <li key={tip}>{fill(tip)}</li>
        ))}
      </ul>
      <div className="screen-actions">
        <button
          type="button"
          data-nav
          className="screen-button"
          onClick={() => useGame.getState().pushScreen({ screen: "credits" })}
        >
          CREDITS
        </button>
      </div>
    </ScreenFrame>
  );
}
