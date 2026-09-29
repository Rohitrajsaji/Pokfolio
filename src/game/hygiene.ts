import type { InputHub } from "./engine/input";
import { sound } from "./audio/sound";
import { useGame } from "./state/store";

/**
 * Keeps the game from acting on stale state: a key held while a screen opens or the page
 * goes full-screen would otherwise still read as "down" when it closes, and the town
 * keeps making noise behind the browser's print dialog.
 */
export function bindHygiene(hub: Pick<InputHub, "releaseAll">): () => void {
  const release = () => hub.releaseAll();
  const beforePrint = () => {
    hub.releaseAll();
    sound.hold(true);
  };
  const afterPrint = () => sound.hold(false);
  const unsubscribe = useGame.subscribe((state, last) => {
    if (state.overlay !== last.overlay || state.stage !== last.stage) release();
  });
  document.addEventListener("fullscreenchange", release);
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
  return () => {
    unsubscribe();
    document.removeEventListener("fullscreenchange", release);
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
  };
}
