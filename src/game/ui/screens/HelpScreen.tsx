"use client";

import { dialogue } from "@content";
import { fill } from "../../text";
import { Paged } from "../Paged";
import { ScreenFrame } from "../ScreenFrame";

/** HELP: what the buttons do, and a few tips. */
export function HelpScreen() {
  return (
    <ScreenFrame title="HELP" accent="#5a6bc4" fit>
      <Paged
        label="Help pages"
        blocks={[
          ...dialogue.help.controls.map(([button, does], i) => (
            <div key={button}>
              {i === 0 && <h3 className="section-title">Controls</h3>}
              <dl className="facts">
                <div className="facts-row">
                  <dt>{button}</dt>
                  <dd>{does}</dd>
                </div>
              </dl>
            </div>
          )),
          ...dialogue.help.tips.map((tip, i) => (
            <div key={tip}>
              {i === 0 && <h3 className="section-title">Tips</h3>}
              <ul className="bullets readable">
                <li>{fill(tip)}</li>
              </ul>
            </div>
          )),
        ]}
      />
    </ScreenFrame>
  );
}
