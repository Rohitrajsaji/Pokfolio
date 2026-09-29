"use client";

import { useState } from "react";
import { sound } from "../audio/sound";
import { useGame, type DialogRequest } from "../state/store";
import { useInputLayer } from "./useInputLayer";
import { useTypewriter } from "./useTypewriter";

/**
 * The text box along the bottom of the screen. Text types out; A (or a
 * click) finishes the line, then moves on. A question ends with YES/NO.
 */
export function DialogBox({ dialog }: { dialog: DialogRequest }) {
  const pages = dialog.ask ? [...dialog.pages, dialog.ask] : dialog.pages;
  const [page, setPage] = useState(0);
  const [choice, setChoice] = useState<0 | 1>(0);
  const text = pages[page] ?? "";
  const { visible, typed, finish } = useTypewriter(text, page);
  const asking = Boolean(dialog.ask) && page === pages.length - 1;

  const close = (answer: boolean | null) => {
    useGame.getState().closeOverlay();
    dialog.onClose?.(answer);
  };

  const advance = () => {
    if (!typed) return finish();
    if (asking) return;
    sound.sfx("text");
    if (page < pages.length - 1) return setPage(page + 1);
    close(null);
  };

  useInputLayer((action) => {
    if (asking && typed) {
      if (action === "up" || action === "down") {
        sound.sfx("cursor");
        setChoice((c) => (c === 0 ? 1 : 0));
      } else if (action === "a") {
        sound.sfx("confirm");
        close(choice === 0);
      } else if (action === "b" || action === "escape") {
        sound.sfx("back");
        close(false);
      }
      return;
    }
    if (action === "a" || action === "b" || action === "escape") advance();
  });

  return (
    <div className="dialog ds-box" onClick={advance} role="group" aria-label="Dialog">
      {dialog.speaker && <p className="dialog-speaker ds-box">{dialog.speaker}</p>}
      <p className="dialog-text" aria-hidden>
        {text.slice(0, visible)}
        <span className="invisible">{text.slice(visible)}</span>
      </p>
      <p className="sr-only" aria-live="polite">
        {dialog.speaker ? `${dialog.speaker}: ` : ""}
        {text}
      </p>
      {typed && !asking && <span className="dialog-next" aria-hidden />}
      {asking && typed && (
        <div className="choice-box ds-box" role="group" aria-label={text}>
          {(["YES", "NO"] as const).map((label, i) => (
            <button
              key={label}
              type="button"
              className="choice"
              aria-pressed={choice === i}
              onMouseEnter={() => setChoice(i as 0 | 1)}
              onClick={(event) => {
                event.stopPropagation();
                sound.sfx("confirm");
                close(i === 0);
              }}
            >
              <span className="choice-cursor" data-on={choice === i ? "" : undefined} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
