/**
 * Game buttons, whatever they come from: keyboard, the on-screen pad, or
 * code. Presses go to the topmost layer (an open menu or dialog), or to the
 * base handler (the town) when no layer is open.
 */
import type { Direction } from "@content/types";

export type Action = Direction | "a" | "b" | "start" | "escape" | "run";

export type PressHandler = (action: Action) => void;

const DIRECTIONS = new Set<Action>(["up", "down", "left", "right"]);

export class InputHub {
  private held = new Set<Action>();
  private directions: Direction[] = [];
  private layers: PressHandler[] = [];
  private base: PressHandler | null = null;

  /** A button went down. Repeats while already held are ignored. */
  press(action: Action): void {
    if (this.held.has(action)) return;
    this.held.add(action);
    if (DIRECTIONS.has(action)) this.directions.push(action as Direction);
    const handler = this.layers.at(-1) ?? this.base;
    handler?.(action);
  }

  release(action: Action): void {
    this.held.delete(action);
    this.directions = this.directions.filter((dir) => dir !== action);
  }

  /** Forget everything held, e.g. when the window loses focus. */
  releaseAll(): void {
    this.held.clear();
    this.directions = [];
  }

  isHeld(action: Action): boolean {
    return this.held.has(action);
  }

  /** The most recently pressed direction that is still held. */
  direction(): Direction | null {
    return this.directions.at(-1) ?? null;
  }

  /** Routes presses to `handler` until the returned function is called. */
  pushLayer(handler: PressHandler): () => void {
    this.layers.push(handler);
    return () => {
      this.layers = this.layers.filter((layer) => layer !== handler);
    };
  }

  setBase(handler: PressHandler | null): void {
    this.base = handler;
  }
}

/** The page's single hub, shared by the engine, the keyboard and the on-screen pad. */
export const input = new InputHub();
