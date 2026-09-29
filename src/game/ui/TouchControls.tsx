"use client";

import type { PointerEvent, ReactNode } from "react";
import { input, type Action } from "../engine/input";

function PadButton({
  action,
  label,
  className,
  children,
}: {
  action: Action;
  label: string;
  className: string;
  children?: ReactNode;
}) {
  const press = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    input.press(action);
  };
  const release = () => input.release(action);
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      className={className}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

/** A handheld-style pad for touch screens: D-pad, A, B and START. */
export function TouchControls() {
  return (
    <div className="touch-controls" aria-hidden>
      <div className="dpad">
        <PadButton action="up" label="Up" className="dpad-up" />
        <PadButton action="left" label="Left" className="dpad-left" />
        <span className="dpad-center" />
        <PadButton action="right" label="Right" className="dpad-right" />
        <PadButton action="down" label="Down" className="dpad-down" />
      </div>
      <PadButton action="start" label="Start menu" className="pad-start">
        START
      </PadButton>
      <div className="ab">
        <PadButton action="b" label="B button" className="pad-b">
          B
        </PadButton>
        <PadButton action="a" label="A button" className="pad-a">
          A
        </PadButton>
      </div>
    </div>
  );
}
