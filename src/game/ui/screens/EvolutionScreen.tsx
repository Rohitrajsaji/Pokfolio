"use client";

import { dialogue, experience } from "@content";
import { useEffect, useState } from "react";
import { formatRange } from "@/lib/dates";
import { sound } from "../../audio/sound";
import { useGame } from "../../state/store";
import { fill, fillWith } from "../../text";
import { ScreenFrame } from "../ScreenFrame";
import { useReducedMotion } from "../useReducedMotion";
import { MessageBox, MonSprite } from "./parts";

/** How long the silhouettes flash before the new form appears. Matches the CSS animation. */
const EVOLVE_MS = 2600;

/** Oldest job first: the evolution line in the order it happened. */
const STAGES = [...experience].sort((a, b) => a.start.localeCompare(b.start));

/** The career as an evolution: each job evolves into the next, with the classic flashing. */
export function EvolutionScreen() {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [evolving, setEvolving] = useState(false);
  const current = STAGES[stage];
  const previous = stage > 0 ? STAGES[stage - 1] : undefined;
  const next = stage < STAGES.length - 1 ? STAGES[stage + 1] : undefined;

  useEffect(() => {
    if (!evolving) return;
    const id = window.setTimeout(() => {
      setEvolving(false);
      setStage((n) => n + 1);
    }, EVOLVE_MS);
    return () => window.clearTimeout(id);
  }, [evolving]);

  // Each new form arrives with a jingle and its cry.
  useEffect(() => {
    if (stage === 0) return;
    sound.playJingle("evolved");
    sound.cry(STAGES[stage].mascot.dex, 0.2);
  }, [stage]);

  const advance = () => {
    if (!next) return useGame.getState().closeOverlay();
    // Pressing A mid-evolution skips the flashing; reduced motion skips it entirely.
    if (evolving || reducedMotion) {
      setEvolving(false);
      setStage(stage + 1);
      return;
    }
    sound.sfx("evolving");
    setEvolving(true);
  };

  let lines: string[];
  if (evolving) {
    lines = [fillWith(dialogue.evolution.evolving, { from: current.mascot.name })];
  } else if (!previous) {
    lines = [fill(dialogue.evolution.intro)];
  } else {
    const names = { from: previous.mascot.name, to: current.mascot.name };
    lines = [fillWith(dialogue.evolution.evolved, names)];
    if (!next) lines.push(fillWith(dialogue.evolution.done, names));
  }

  const role = (i: number) => {
    if (evolving) return i === stage ? "evo-from" : i === stage + 1 ? "evo-to" : "evo-hidden";
    return i === stage ? "evo-now" : "evo-hidden";
  };

  return (
    <ScreenFrame title="EVOLUTION" accent="#7a55b8">
      <div className="evo">
        {/* Every stage is drawn up front, so the next sprite is loaded before it's needed. */}
        <div className="evo-stage" data-evolving={evolving ? "" : undefined}>
          {STAGES.map((job, i) => (
            <MonSprite
              key={job.id}
              mon={job.mascot}
              decorative={role(i) !== "evo-now"}
              className={`evo-mon ${role(i)}`}
            />
          ))}
        </div>
        <p className="evo-caption">
          <span className="entry-kicker">
            STAGE {stage + 1} OF {STAGES.length} · {current.mascot.name}
          </span>
          <span className="evo-job">
            {current.role}, {current.company}
          </span>
          <span className="entry-kicker">{formatRange(current.start, current.end)}</span>
        </p>
        <MessageBox lines={lines}>
          <div className="screen-actions">
            <button type="button" data-nav className="screen-button" onClick={advance}>
              {evolving ? "SKIP" : next ? "NEXT" : "DONE"}
            </button>
          </div>
        </MessageBox>
      </div>
    </ScreenFrame>
  );
}
