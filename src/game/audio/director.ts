/**
 * Picks the music for the moment and keeps it in step as the visitor moves
 * around. Kept apart from the Web Audio code so it can be tested.
 */
import type { GameState } from "../state/store";

export type MusicId = "town" | "indoor" | "battle";

export interface MusicPlayer {
  setEnabled(enabled: boolean): void;
  playMusic(id: MusicId): void;
}

interface GameStore {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;
}

/** Battle music in a battle, the town theme outdoors, the indoor theme in buildings. */
export function musicFor(state: Pick<GameState, "mapId" | "overlay">): MusicId {
  if (state.overlay?.kind === "battle") return "battle";
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
