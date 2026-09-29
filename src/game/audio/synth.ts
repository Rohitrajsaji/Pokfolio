/**
 * Web Audio building blocks: pulse, triangle and noise voices like an old
 * handheld's sound chip, a step sequencer for the music, and a player for
 * the tone-based sound effects. Browser only.
 */
import type { Drum, NoteEvent } from "./notes";
import type { Tone } from "./sfx";
import type { Channel, CompiledTrack } from "./tracks";

/** How far ahead notes are scheduled, and how often the scheduler wakes up to do it. */
const LOOKAHEAD = 0.12;
const TICK_MS = 25;
/** Notes sound for this share of their length, so repeated notes stay separate. */
const GATE = 0.9;
/** How quickly an arpeggio hops between its notes. */
const ARPEGGIO_SECONDS = 0.05;

interface Voice {
  /** A pulse wave's duty cycle, or a built-in wave type. */
  duty?: number;
  type?: OscillatorType;
  gain: number;
}

const VOICES: Readonly<Record<Exclude<Channel, "drums">, Voice>> = {
  lead: { duty: 0.25, gain: 0.13 },
  harmony: { duty: 0.125, gain: 0.06 },
  bass: { type: "triangle", gain: 0.26 },
};

interface Kit {
  pulses: Map<number, PeriodicWave>;
  noise: AudioBuffer;
}

const kits = new WeakMap<BaseAudioContext, Kit>();

/** Shared waves and white noise for one audio context. */
function kit(ctx: AudioContext): Kit {
  let found = kits.get(ctx);
  if (!found) {
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    found = { pulses: new Map(), noise };
    kits.set(ctx, found);
  }
  return found;
}

/** A pulse wave with the given duty cycle (0.5 is a square wave), built from its Fourier series. */
function pulseWave(ctx: AudioContext, duty: number): PeriodicWave {
  const { pulses } = kit(ctx);
  let wave = pulses.get(duty);
  if (!wave) {
    const harmonics = 48;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let n = 1; n < harmonics; n++) {
      real[n] = Math.sin(2 * Math.PI * n * duty) / (Math.PI * n);
      imag[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (Math.PI * n);
    }
    wave = ctx.createPeriodicWave(real, imag);
    pulses.set(duty, wave);
  }
  return wave;
}

function oscillator(ctx: AudioContext, voice: Pick<Voice, "duty" | "type">): OscillatorNode {
  const osc = ctx.createOscillator();
  if (voice.duty !== undefined) osc.setPeriodicWave(pulseWave(ctx, voice.duty));
  else osc.type = voice.type ?? "square";
  return osc;
}

/** A note's loudness: a quick attack, a gentle fall, and a short release so it doesn't click. */
function envelope(ctx: AudioContext, peak: number, start: number, end: number): GainNode {
  const gain = ctx.createGain();
  const attacked = start + 0.005;
  const releasing = Math.max(attacked, end - 0.015);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, attacked);
  gain.gain.linearRampToValueAtTime(peak * 0.65, releasing);
  gain.gain.linearRampToValueAtTime(0, end);
  return gain;
}

function playDrum(ctx: AudioContext, out: AudioNode, drum: Drum, time: number): void {
  if (drum === "k") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + 0.16);
    return;
  }
  const snare = drum === "s";
  const decay = snare ? 0.12 : 0.04;
  const source = ctx.createBufferSource();
  source.buffer = kit(ctx).noise;
  const filter = ctx.createBiquadFilter();
  filter.type = snare ? "bandpass" : "highpass";
  filter.frequency.value = snare ? 1800 : 7000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(snare ? 0.28 : 0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  source.connect(filter).connect(gain).connect(out);
  source.start(time, Math.random() * 0.5);
  source.stop(time + decay + 0.01);
}

function playNote(
  ctx: AudioContext,
  out: AudioNode,
  channel: Channel,
  event: NoteEvent,
  time: number,
  stepSeconds: number,
): void {
  if (event.drum) return playDrum(ctx, out, event.drum, time);
  if (channel === "drums" || event.freqs.length === 0) return;
  const voice = VOICES[channel];
  const end = time + Math.max(0.03, event.steps * stepSeconds * GATE);
  const osc = oscillator(ctx, voice);
  if (event.freqs.length === 1) {
    osc.frequency.setValueAtTime(event.freqs[0], time);
  } else {
    // A chord is a fast arpeggio: one voice hopping between the notes.
    for (let at = time, i = 0; at < end; at += ARPEGGIO_SECONDS, i++) {
      osc.frequency.setValueAtTime(event.freqs[i % event.freqs.length], at);
    }
  }
  osc.connect(envelope(ctx, voice.gain, time, end)).connect(out);
  osc.start(time);
  osc.stop(end + 0.01);
}

/** Plays a compiled track into `destination`, looping or once. */
export class Sequencer {
  private readonly output: GainNode;
  private timer = 0;
  private step = 0;
  private nextTime = 0;
  private scheduling = true;
  private stopped = false;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
    private readonly track: CompiledTrack,
    private readonly onEnd?: () => void,
  ) {
    this.output = ctx.createGain();
    this.output.connect(destination);
  }

  start(): void {
    this.nextTime = this.ctx.currentTime + 0.05;
    this.schedule();
    this.timer = window.setInterval(this.schedule, TICK_MS);
  }

  /** Fades out and stops; a jingle stopped this way never reports that it ended. */
  stop(fade = 0.25): void {
    if (this.stopped) return;
    this.stopped = true;
    this.scheduling = false;
    window.clearInterval(this.timer);
    const now = this.ctx.currentTime;
    const gain = this.output.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + fade);
    window.setTimeout(() => this.output.disconnect(), (fade + LOOKAHEAD) * 1000 + 100);
  }

  private schedule = () => {
    const horizon = this.ctx.currentTime + LOOKAHEAD;
    while (this.scheduling && this.nextTime < horizon) {
      for (const { channel, event } of this.track.byStep[this.step]) {
        playNote(this.ctx, this.output, channel, event, this.nextTime, this.track.stepSeconds);
      }
      this.nextTime += this.track.stepSeconds;
      this.step++;
      if (this.step < this.track.steps) continue;
      if (this.track.loop) this.step = 0;
      else this.finish();
    }
  };

  /** A jingle has scheduled its last note: report the end once it has sounded. */
  private finish(): void {
    this.scheduling = false;
    window.clearInterval(this.timer);
    const left = Math.max(0, this.nextTime - this.ctx.currentTime);
    window.setTimeout(
      () => {
        if (this.stopped) return;
        this.stopped = true;
        this.output.disconnect();
        this.onEnd?.();
      },
      left * 1000 + 150,
    );
  }
}

/** Plays a sound effect's tones into `out`, starting `delay` seconds from now. */
export function playTones(
  ctx: AudioContext,
  out: AudioNode,
  tones: readonly Tone[],
  delay = 0,
): void {
  const start = ctx.currentTime + delay + 0.01;
  for (const tone of tones) {
    const from = start + (tone.delay ?? 0);
    const end = from + tone.duration;
    const peak = tone.gain ?? 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, from);
    gain.gain.linearRampToValueAtTime(peak, from + 0.004);
    gain.gain.setValueAtTime(peak, Math.max(from + 0.004, end - 0.02));
    gain.gain.linearRampToValueAtTime(0, end);
    gain.connect(out);

    if (tone.wave === "noise") {
      const source = ctx.createBufferSource();
      source.buffer = kit(ctx).noise;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 1.2;
      filter.frequency.setValueAtTime(tone.from, from);
      if (tone.to) filter.frequency.exponentialRampToValueAtTime(tone.to, end);
      source.connect(filter).connect(gain);
      source.start(from, Math.random() * 0.5);
      source.stop(end + 0.01);
    } else {
      const osc = oscillator(ctx, tone.wave === "pulse" ? { duty: 0.25 } : { type: tone.wave });
      osc.frequency.setValueAtTime(tone.from, from);
      if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, end);
      osc.connect(gain);
      osc.start(from);
      osc.stop(end + 0.01);
    }
  }
}
