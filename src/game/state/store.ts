/**
 * Game state shared by the engine (outside React) and the UI (inside React):
 * where the visitor is, what's open on screen, and their settings.
 */
import type { CameoId, PaletteId, ScreenRequest, SecretId } from "@content/types";
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
  | { kind: "battle"; id: number }
  /** A short full-screen moment (something pops out of the TV, the screen glitches). */
  | { kind: "cameo"; id: number; cameo: CameoId; after?: string[] };

/** Where the visit is: the title screen, the short intro, or the game itself. */
export type Stage = "title" | "intro" | "play";

export type TextSpeed = "slow" | "normal" | "fast" | "instant";

export interface Settings {
  textSpeed: TextSpeed;
  time: "auto" | TimeOfDay;
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = { textSpeed: "normal", time: "auto", sound: false };

/** What the visitor has picked from the prizes they've won. */
export interface Cosmetics {
  /** An id from content/cosmetics.ts. */
  look: string;
  palette: PaletteId;
}

export const DEFAULT_COSMETICS: Cosmetics = { look: "classic", palette: "normal" };

export interface GameState {
  /** How much of the world the window shows, in game pixels. Set by the game as the window changes. */
  view: { width: number; height: number } | null;
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
  /** Secrets found so far. Nothing is saved: a new visit starts with none. */
  secrets: readonly SecretId[];
  /** How many times each thing (by key) has been talked to or read, this visit. */
  visits: Readonly<Record<string, number>>;
  /** The highest level of VOLTORB FLIP cleared this visit (0 before the first): what prizes are won. */
  cleared: number;
  cosmetics: Cosmetics;
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
  /** Records a level of VOLTORB FLIP as cleared. */
  clearLevel: (level: number) => void;
  /** Picks a look or a screen colour. */
  choose: (choice: Partial<Cosmetics>) => void;
  /** Reveals a secret (once). */
  unlock: (secret: SecretId) => void;
  /** Counts a visit to something and says how many there have been, this one included. */
  visit: (key: string) => number;
  /** Starts a cameo; the lines in `after` are said once it's over. */
  showCameo: (cameo: CameoId, after?: string[]) => void;
  setStage: (stage: Stage) => void;
  setView: (view: { width: number; height: number }) => void;
  setMap: (mapId: MapId) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setMenuIndex: (index: number) => void;
  setHint: (hint: string | null) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setCaught: (caught: boolean) => void;
}

/** Every dialog and screen gets a fresh id, so reopening one starts it over. */
let overlayCount = 0;

/** Whether this very screen (the same page of it) is already the one open. */
function isOpen(overlay: Overlay | null, request: ScreenRequest): boolean {
  return overlay?.kind === "screen" && JSON.stringify(overlay.request) === JSON.stringify(request);
}

export const useGame = create<GameState>()((set, get) => ({
  view: null,
  stage: "title",
  mapId: "town",
  position: { x: 0, y: 0 },
  overlay: null,
  menuIndex: 0,
  hint: null,
  settings: DEFAULT_SETTINGS,
  caught: false,
  secrets: [],
  visits: {},
  cleared: 0,
  cosmetics: DEFAULT_COSMETICS,
  travel: null,
  say: (dialog) => set({ overlay: { kind: "dialog", id: ++overlayCount, dialog } }),
  closeOverlay: () =>
    set((state) => ({ overlay: state.overlay?.kind === "screen" ? state.overlay.back : null })),
  closeAll: () => set({ overlay: null }),
  openMenu: () => set({ overlay: { kind: "menu" } }),
  openScreen: (request, fromMenu = false) =>
    set((state) =>
      isOpen(state.overlay, request)
        ? state
        : {
            overlay: {
              kind: "screen",
              id: ++overlayCount,
              request,
              back: fromMenu ? { kind: "menu" } : null,
            },
          },
    ),
  // One screen at a time: this one takes the place of the one open, which closes back to where that came from.
  pushScreen: (request) =>
    set((state) => {
      if (isOpen(state.overlay, request)) return state;
      const open = state.overlay;
      const back = open?.kind === "screen" ? open.back : open?.kind === "dialog" ? null : open;
      return { overlay: { kind: "screen", id: ++overlayCount, request, back } };
    }),
  startBattle: () => set({ overlay: { kind: "battle", id: ++overlayCount } }),
  clearLevel: (level) => set((state) => (level > state.cleared ? { cleared: level } : state)),
  choose: (choice) => set((state) => ({ cosmetics: { ...state.cosmetics, ...choice } })),
  unlock: (secret) =>
    set((state) =>
      state.secrets.includes(secret) ? state : { secrets: [...state.secrets, secret] },
    ),
  visit: (key) => {
    const count = (get().visits[key] ?? 0) + 1;
    set((state) => ({ visits: { ...state.visits, [key]: count } }));
    return count;
  },
  showCameo: (cameo, after) =>
    set({ overlay: { kind: "cameo", id: ++overlayCount, cameo, after } }),
  setStage: (stage) => set({ stage }),
  setView: (view) =>
    set((state) =>
      state.view?.width === view.width && state.view.height === view.height ? state : { view },
    ),
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
