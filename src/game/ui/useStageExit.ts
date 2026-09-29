import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/** How long a stage fades to black before the next one begins. Keep in step with globals.css. */
export const STAGE_FADE_MS = 300;

/**
 * Leaving a stage (the title screen, the intro) fades to black, then calls
 * `next`. Visitors who asked for less motion go straight there. `leave`
 * returns whether this call started the exit, so a second press is ignored.
 */
export function useStageExit(next: () => void): { leaving: boolean; leave: () => boolean } {
  const reducedMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const started = useRef(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const leave = () => {
    if (started.current) return false;
    started.current = true;
    if (reducedMotion) {
      next();
    } else {
      setLeaving(true);
      timer.current = window.setTimeout(next, STAGE_FADE_MS);
    }
    return true;
  };
  return { leaving, leave };
}
