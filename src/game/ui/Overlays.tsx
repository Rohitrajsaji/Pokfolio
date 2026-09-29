"use client";

import { useEffect, useState } from "react";
import { useGame } from "../state/store";
import { BattleScreen } from "./battle/BattleScreen";
import { Cameo } from "./Cameo";
import { DialogBox } from "./DialogBox";
import { StartMenu } from "./StartMenu";

/** How long the hint takes to slide out (the CSS animation is the same length). */
const HINT_OUT_MS = 250;

/** Door hint, shown while standing in front of a building. */
function HintBanner() {
  const hint = useGame((state) => state.hint);
  const overlay = useGame((state) => state.overlay);
  const wanted = overlay ? null : hint;
  // When the hint goes, the banner slides back out, showing the words it had.
  const [shown, setShown] = useState<string | null>(wanted);
  const [leaving, setLeaving] = useState(false);
  if (wanted && (wanted !== shown || leaving)) {
    setShown(wanted);
    setLeaving(false);
  } else if (!wanted && shown && !leaving) {
    setLeaving(true);
  }
  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, HINT_OUT_MS);
    return () => window.clearTimeout(id);
  }, [leaving]);
  if (!shown) return null;
  return (
    <p className="hint-banner ds-box" aria-live="polite" data-leaving={leaving ? "" : undefined}>
      <span className="hint-arrow" aria-hidden />
      {shown}
    </p>
  );
}

/** What sits on the game screen itself: the door hint, the text box, the START menu, battles and cameos. */
export function Overlays() {
  const overlay = useGame((state) => state.overlay);
  return (
    <>
      <HintBanner />
      {overlay?.kind === "dialog" && <DialogBox key={overlay.id} dialog={overlay.dialog} />}
      {overlay?.kind === "menu" && <StartMenu />}
      {overlay?.kind === "battle" && <BattleScreen key={overlay.id} />}
      {overlay?.kind === "cameo" && (
        <Cameo key={overlay.id} cameo={overlay.cameo} after={overlay.after} />
      )}
    </>
  );
}
