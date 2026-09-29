"use client";

import { profile } from "@content";
import type { ScreenRequest } from "@content/types";
import { useRef } from "react";
import { sound } from "../audio/sound";
import { useGame } from "../state/store";
import { useMenuNavigation } from "./useMenuNavigation";

interface MenuItem {
  label: string;
  note: string;
  request: ScreenRequest | null;
}

/** The START menu. Each entry names the game screen and what it holds. */
export const MENU_ITEMS: readonly MenuItem[] = [
  { label: "POKéDEX", note: "Projects", request: { screen: "dex" } },
  { label: "POKéMON", note: "Career", request: { screen: "party" } },
  { label: "BAG", note: "Skills", request: { screen: "bag" } },
  { label: profile.shortName, note: "Trainer card", request: { screen: "card" } },
  { label: "POKéGEAR", note: "Contact", request: { screen: "contact" } },
  { label: "TOWN MAP", note: "Fast travel", request: { screen: "map" } },
  { label: "OPTIONS", note: "Text, time, sound", request: { screen: "options" } },
  { label: "RÉSUMÉ", note: "Full résumé", request: { screen: "resume" } },
  { label: "EXIT", note: "Back to the town", request: null },
];

export function StartMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useGame((state) => state.menuIndex);
  const close = () => {
    sound.sfx("back");
    useGame.getState().closeAll();
  };
  useMenuNavigation(ref, { onBack: close, initial });

  const choose = (item: MenuItem, index: number) => {
    const game = useGame.getState();
    game.setMenuIndex(index);
    if (item.request) game.openScreen(item.request, true);
    else close();
  };

  return (
    <div ref={ref} className="start-menu ds-box" role="menu" aria-label="Menu">
      {MENU_ITEMS.map((item, index) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          data-nav
          aria-describedby={item.note ? `menu-note-${index}` : undefined}
          className="menu-item"
          onClick={() => choose(item, index)}
          onMouseEnter={(event) => event.currentTarget.focus()}
        >
          <span className="menu-label">{item.label}</span>
          {item.note && (
            <span id={`menu-note-${index}`} hidden>
              {item.note}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
