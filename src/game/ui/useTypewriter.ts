import { useEffect, useState } from "react";
import { useGame, type TextSpeed } from "../state/store";
import { useReducedMotion } from "./useReducedMotion";

const CHARS_PER_SECOND: Record<Exclude<TextSpeed, "instant">, number> = {
  slow: 28,
  normal: 55,
  fast: 110,
};

/**
 * Types `text` out at the visitor's text speed (all at once for "instant" or
 * reduced motion). A new `id` starts over, even when the text is the same.
 */
export function useTypewriter(
  text: string,
  id: string | number,
): { visible: number; typed: boolean; finish: () => void } {
  const speed = useGame((state) => state.settings.textSpeed);
  const reducedMotion = useReducedMotion();
  const cps = speed === "instant" || reducedMotion ? Infinity : CHARS_PER_SECOND[speed];
  const [progress, setProgress] = useState({ id, shown: 0 });
  const shown = progress.id === id ? progress.shown : 0;

  useEffect(() => {
    if (!Number.isFinite(cps)) return;
    const timer = window.setInterval(() => {
      setProgress((last) => {
        const at = last.id === id ? last.shown : 0;
        return at < text.length ? { id, shown: at + 1 } : last;
      });
    }, 1000 / cps);
    return () => window.clearInterval(timer);
  }, [cps, id, text.length]);

  const typed = !Number.isFinite(cps) || shown >= text.length;
  return {
    visible: typed ? text.length : shown,
    typed,
    finish: () => setProgress({ id, shown: text.length }),
  };
}
