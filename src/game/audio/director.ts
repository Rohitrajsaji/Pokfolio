/**
 * Picks the music for the moment and keeps it in step as the visitor moves
 * around. Kept apart from the Web Audio code so it can be tested.
 */
import type { GameState } from "../state/store";

export type MusicId = "title" | "town" | "indoor" | "arcade" | "battle";

export interface MusicPlayer {
  setEnabled(enabled: boolean): void;
  playMusic(id: MusicId): void;
}

interface GameStore {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;
}

/**
 * The title theme until the adventure begins, then battle music in a battle, the
 * town theme outdoors, the indoor theme in buildings, and the Game Corner's own tune downstairs.
 */
export function musicFor(state: Pick<GameState, "stage" | "mapId" | "overlay">): MusicId {
  if (state.stage !== "play") return "title";
  if (state.overlay?.kind === "battle") return "battle";
  if (state.mapId === "arcade") return "arcade";
  return state.mapId === "town" ? "town" : "indoor";
}

/** Keeps `player` in step with the game until the returned function is called. */
export function directMusic(store: GameStore, player: MusicPlayer): () => void {
  let enabled: boolean | null = null;
  let playing: MusicId | null = null;
  const sync = (state: GameState) => {
    if (state.settings.sound !== enabled) {
      enabled = state.settings.sound;
      playing = null;
      player.setEnabled(enabled);
    }
    if (!enabled) return;
    const music = musicFor(state);
    if (music !== playing) {
      playing = music;
      player.playMusic(music);
    }
  };
  sync(store.getState());
  return store.subscribe(sync);
}
