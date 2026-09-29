"use client";

import { useGame } from "../state/store";
import { BattleScreen } from "./battle/BattleScreen";
import { DialogBox } from "./DialogBox";
import { StartMenu } from "./StartMenu";

/** Door hint, shown while standing in front of a building. */
function HintBanner() {
  const hint = useGame((state) => state.hint);
  const overlay = useGame((state) => state.overlay);
  if (!hint || overlay) return null;
  return (
    <p className="hint-banner ds-box" aria-live="polite">
      <span className="hint-arrow" aria-hidden />
      {hint}
    </p>
  );
}

/** What sits on the game screen itself: the door hint, the text box, the START menu and battles. */
export function Overlays() {
  const overlay = useGame((state) => state.overlay);
  return (
    <>
      <HintBanner />
      {overlay?.kind === "dialog" && <DialogBox key={overlay.id} dialog={overlay.dialog} />}
      {overlay?.kind === "menu" && <StartMenu />}
      {overlay?.kind === "battle" && <BattleScreen key={overlay.id} />}
    </>
  );
}
