/**
 * Game state shared by the engine (outside React) and the UI (inside React):
 * where the visitor is, what's open on screen, and their settings.
 */
import type { ScreenRequest } from "@content/types";
import { create } from "zustand";
import type { TimeOfDay } from "../engine/time";
import type { MapId, Spot } from "../world/runtime";
import { saveSettings } from "./settings";

export interface DialogRequest {
  pages: string[];
  /** Shown above the text, e.g. "NURSE". */
  speaker?: string;
  /** A YES/NO question asked after the pages. */
  ask?: string;
  /** Called after the box closes: the YES/NO answer, or null when nothing was asked. */
  onClose?: (answer: boolean | null) => void;
}

export type Overlay =
  | { kind: "dialog"; id: number; dialog: DialogRequest }
  | { kind: "menu" }
  /**
   * `back` is where closing the screen returns to: the START menu, the screen
   * it was opened from, or nothing (back to walking around).
   */
  | { kind: "screen"; id: number; request: ScreenRequest; back: Overlay | null }
  /** The catch-to-hire battle in the tall grass. */
  | { kind: "battle"; id: number };

/** Where the visit is: the title screen, the short intro, or the game itself. */
export type Stage = "title" | "intro" | "play";

export type TextSpeed = "slow" | "normal" | "fast" | "instant";

export interface Settings {
  textSpeed: TextSpeed;
  time: "auto" | TimeOfDay;
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = { textSpeed: "normal", time: "auto", sound: false };

export interface GameState {
  stage: Stage;
  mapId: MapId;
  position: { x: number; y: number };
  overlay: Overlay | null;
  /** The START menu remembers where its cursor was. */
  menuIndex: number;
  /** The door the visitor is standing in front of, if any. */
  hint: string | null;
  settings: Settings;
  /** Whether the visitor has caught the wild ROHIT. */
  caught: boolean;
  /** Provided by the running game: moves the visitor (Town Map fast travel). */
  travel: ((to: MapId, spot?: Spot) => void) | null;
  say: (dialog: DialogRequest) => void;
  /** Closes what's on top, going back to whatever a screen was opened from. */
  closeOverlay: () => void;
  /** Closes everything, back to walking around. */
  closeAll: () => void;
  openMenu: () => void;
  /** Opens a screen from the world, or from the START menu when `fromMenu`. */
  openScreen: (request: ScreenRequest, fromMenu?: boolean) => void;
  /** Opens a screen from inside the current one; closing it comes back here. */
  pushScreen: (request: ScreenRequest) => void;
  startBattle: () => void;
  setStage: (stage: Stage) => void;
  setMap: (mapId: MapId) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setMenuIndex: (index: number) => void;
  setHint: (hint: string | null) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setCaught: (caught: boolean) => void;
}

/** Every dialog and screen gets a fresh id, so reopening one starts it over. */
let overlayCount = 0;

export const useGame = create<GameState>()((set) => ({
  stage: "title",
  mapId: "town",
  position: { x: 0, y: 0 },
  overlay: null,
  menuIndex: 0,
  hint: null,
  settings: DEFAULT_SETTINGS,
  caught: false,
  travel: null,
  say: (dialog) => set({ overlay: { kind: "dialog", id: ++overlayCount, dialog } }),
  closeOverlay: () =>
    set((state) => ({ overlay: state.overlay?.kind === "screen" ? state.overlay.back : null })),
  closeAll: () => set({ overlay: null }),
  openMenu: () => set({ overlay: { kind: "menu" } }),
  openScreen: (request, fromMenu = false) =>
    set({
      overlay: {
        kind: "screen",
        id: ++overlayCount,
        request,
        back: fromMenu ? { kind: "menu" } : null,
      },
    }),
  pushScreen: (request) =>
    set((state) => ({
      overlay: {
        kind: "screen",
        id: ++overlayCount,
        request,
        back: state.overlay?.kind === "dialog" ? null : state.overlay,
      },
    })),
  startBattle: () => set({ overlay: { kind: "battle", id: ++overlayCount } }),
  setStage: (stage) => set({ stage }),
  setMap: (mapId) => set({ mapId, hint: null }),
  setPosition: (position) => set({ position }),
  setMenuIndex: (menuIndex) => set({ menuIndex }),
  setHint: (hint) => set({ hint }),
  updateSettings: (patch) =>
    set((state) => {
      const settings = { ...state.settings, ...patch };
      saveSettings(settings);
      return { settings };
    }),
  setCaught: (caught) => set({ caught }),
}));
