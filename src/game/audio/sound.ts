/**
 * Everything the visitor hears: original chiptune music and sound effects
 * made with the Web Audio API, plus official Pokémon cries. Nothing is
 * created until the visitor turns sound on, and since browsers only let
 * audio start after a click or key press, it waits for one if it must.
 */
import { cryUrl } from "@/pokeapi/sprites";
import type { MusicId, MusicPlayer } from "./director";
import { SFX, type SfxName } from "./sfx";
import { Sequencer, playTones } from "./synth";
import { TRACKS, compileTrack, type CompiledTrack, type TrackId } from "./tracks";

const VOLUME = { master: 0.8, music: 0.5, sfx: 0.6, cries: 0.6 } as const;

export type Jingle = "caught" | "evolved" | "healed";

/** Events that count as the visitor asking for sound; iOS only accepts some of them (`touchend`, `click`). */
const GESTURES = ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const;

interface Mixer {
  ctx: AudioContext;
  music: GainNode;
  sfx: GainNode;
  cries: GainNode;
}

class Sound implements MusicPlayer {
  private mixer: Mixer | null = null;
  private enabled = false;
  private waitingForGesture = false;
  /** The browser is showing something over the game (the print dialog), so nothing should play. */
  private held = false;
  /** The music the game wants: it plays whenever no jingle is playing. */
  private wanted: MusicId | null = null;
  private music: { id: MusicId; sequencer: Sequencer } | null = null;
  private jingle: Sequencer | null = null;
  private readonly tracks = new Map<TrackId, CompiledTrack>();
  private readonly cries = new Map<number, Promise<AudioBuffer | null>>();

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusic(0.1);
      this.jingle?.stop(0.05);
      this.jingle = null;
      void this.mixer?.ctx.suspend();
      return;
    }
    if (navigator.userActivation?.hasBeenActive) this.wake();
    else this.waitForGesture();
  }

  playMusic(id: MusicId): void {
    this.wanted = id;
    if (this.music?.id === id || this.jingle) return;
    this.stopMusic();
    this.startMusic();
  }

  /** A short tune in place of the music; the music comes back when it ends. */
  playJingle(id: Jingle): void {
    const mixer = this.ready();
    if (!mixer) return;
    this.stopMusic(0.1);
    this.jingle?.stop(0.05);
    const jingle = new Sequencer(mixer.ctx, mixer.music, this.track(id), () => {
      if (this.jingle !== jingle) return;
      this.jingle = null;
      this.startMusic();
    });
    this.jingle = jingle;
    jingle.start();
  }

  /** Plays a sound effect, `delay` seconds from now. */
  sfx(name: SfxName, delay = 0): void {
    const mixer = this.ready();
    if (mixer) playTones(mixer.ctx, mixer.sfx, SFX[name], delay);
  }

  /** Plays a Pokémon's cry. It's fetched from PokeAPI the first time. */
  cry(id: number, delay = 0): void {
    const mixer = this.ready();
    if (!mixer) return;
    void this.loadCry(mixer.ctx, id).then((buffer) => {
      if (!buffer || !this.ready()) return;
      const source = mixer.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(mixer.cries);
      source.start(mixer.ctx.currentTime + delay);
    });
  }

  /** Starts fetching cries now, so they're ready when they're needed. */
  preloadCries(ids: readonly number[]): void {
    const mixer = this.ready();
    if (mixer) for (const id of ids) void this.loadCry(mixer.ctx, id);
  }

  private loadCry(ctx: AudioContext, id: number): Promise<AudioBuffer | null> {
    let cry = this.cries.get(id);
    if (!cry) {
      cry = fetch(cryUrl(id))
        .then((response) => {
          if (!response.ok) throw new Error(`Cry ${id}: HTTP ${response.status}`);
          return response.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        // Offline, or a browser that can't decode Ogg: the game just goes without.
        .catch(() => null);
      this.cries.set(id, cry);
    }
    return cry;
  }

  /** The mixer, while sound is on and allowed to play. */
  private ready(): Mixer | null {
    return this.enabled ? this.mixer : null;
  }

  private wake(): void {
    const mixer = this.mixer ?? this.createMixer();
    if (!mixer) return;
    this.resume(mixer.ctx);
    if (!this.music && !this.jingle) this.startMusic();
  }

  /** Starts the audio again; if the browser won't yet, it waits for the visitor's next tap or key. */
  private resume(ctx: AudioContext): void {
    const stillStopped = () => {
      if (this.enabled && !this.held && !document.hidden && ctx.state !== "running") {
        this.waitForGesture();
      }
    };
    ctx.resume().then(stillStopped, () => this.waitForGesture());
  }

  private waitForGesture(): void {
    if (this.waitingForGesture) return;
    this.waitingForGesture = true;
    const unlock = () => {
      for (const type of GESTURES) window.removeEventListener(type, unlock, true);
      this.waitingForGesture = false;
      if (this.enabled) this.wake();
    };
    for (const type of GESTURES) window.addEventListener(type, unlock, true);
  }

  private createMixer(): Mixer | null {
    if (typeof AudioContext === "undefined") return null;
    const ctx = new AudioContext();
    // A limiter, so music, effects and cries together never clip.
    const limiter = ctx.createDynamicsCompressor();
    limiter.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = VOLUME.master;
    master.connect(limiter);
    const bus = (volume: number) => {
      const gain = ctx.createGain();
      gain.gain.value = volume;
      gain.connect(master);
      return gain;
    };
    this.mixer = { ctx, music: bus(VOLUME.music), sfx: bus(VOLUME.sfx), cries: bus(VOLUME.cries) };
    document.addEventListener("visibilitychange", this.onVisibility);
    // Coming back from the back/forward cache, the audio may have been stopped in the meantime.
    window.addEventListener("pageshow", this.onVisibility);
    ctx.addEventListener("statechange", this.onStateChange);
    return this.mixer;
  }

  /** Pauses everything while the browser shows something over the game (the print dialog). */
  hold(on: boolean): void {
    this.held = on;
    const ctx = this.mixer?.ctx;
    if (!ctx) return;
    if (on) void ctx.suspend();
    else if (this.enabled && !document.hidden) this.resume(ctx);
  }

  /** Nothing plays in a hidden tab. */
  private onVisibility = () => {
    const ctx = this.mixer?.ctx;
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (this.enabled && !this.held) this.resume(ctx);
  };

  /**
   * iOS stops the audio for a phone call, Siri or another app (the context goes "interrupted"), and
   * won't start it again until the visitor next taps or presses a key. Wait for that, then carry on.
   */
  private onStateChange = () => {
    const ctx = this.mixer?.ctx;
    if (!ctx || !this.enabled || this.held || document.hidden) return;
    if (ctx.state !== "running") this.waitForGesture();
  };

  private startMusic(): void {
    const mixer = this.ready();
    if (!mixer || !this.wanted) return;
    const sequencer = new Sequencer(mixer.ctx, mixer.music, this.track(this.wanted));
    this.music = { id: this.wanted, sequencer };
    sequencer.start();
  }

  private stopMusic(fade = 0.3): void {
    this.music?.sequencer.stop(fade);
    this.music = null;
  }

  private track(id: TrackId): CompiledTrack {
    let track = this.tracks.get(id);
    if (!track) {
      track = compileTrack(TRACKS[id]);
      this.tracks.set(id, track);
    }
    return track;
  }
}

/** The page's one sound system. Silent until the visitor turns sound on. */
export const sound = new Sound();
