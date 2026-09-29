// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./synth", () => ({
  Sequencer: class {
    start() {}
    stop() {}
  },
  playTones: vi.fn(),
}));
vi.mock("@/pokeapi/sprites", () => ({ cryUrl: (id: number) => `cry/${id}` }));

import { sound } from "./sound";

interface FakeSource {
  buffer: unknown;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
}

/** Every cry that has been started, in order, and the gain that carries it. */
let sources: FakeSource[] = [];
let gains: Array<{
  gain: {
    value: number;
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
}> = [];

/** Cries whose files haven't arrived yet: resolving one lets it finish loading. */
let pending: Record<number, () => void> = {};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeAll(() => {
  class FakeContext {
    currentTime = 5;
    state = "running";
    destination = {};
    createDynamicsCompressor() {
      return { connect: vi.fn() };
    }
    createGain() {
      const node = {
        gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      gains.push(node);
      return node;
    }
    createBufferSource(): FakeSource {
      const source: FakeSource = {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      };
      sources.push(source);
      return source;
    }
    decodeAudioData(data: unknown) {
      return Promise.resolve({ data });
    }
    resume() {
      return Promise.resolve();
    }
    suspend() {
      return Promise.resolve();
    }
    addEventListener() {}
  }
  vi.stubGlobal("AudioContext", FakeContext);
  Object.defineProperty(navigator, "userActivation", {
    configurable: true,
    value: { hasBeenActive: true },
  });
  // A cry's file arrives when the test says so, or straight away when it doesn't mind.
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const id = Number(url.split("/")[1]);
      const arrive = () => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(id)) });
      if (!(id in pending)) return Promise.resolve(arrive());
      return new Promise((resolve) => {
        pending[id] = () => resolve(arrive());
      });
    }),
  );
});

beforeEach(() => {
  sources = [];
  gains = [];
  pending = {};
  sound.setEnabled(true);
});

afterEach(() => sound.setEnabled(false));

/** The sources that have begun to sound. */
const started = () => sources.filter((source) => source.start.mock.calls.length > 0);

describe("the newest cry wins", () => {
  it("stops the cry that's sounding, at once, when another begins", async () => {
    sound.cry(101);
    await settle();
    expect(started()).toHaveLength(1);
    const [first] = sources;
    expect(first.stop).not.toHaveBeenCalled();

    sound.cry(102);
    await settle();
    expect(first.stop).toHaveBeenCalledTimes(1);
    // It fades out over a moment too short to hear, rather than clicking off.
    const fade = gains.find((node) => node.gain.linearRampToValueAtTime.mock.calls.length > 0);
    expect(fade?.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
    expect(started()).toHaveLength(2);
    expect(sources[1].stop).not.toHaveBeenCalled();
  });

  it("drops a cry still loading when a newer one has been asked for, so it can't play late", async () => {
    pending[201] = () => {};
    sound.cry(201);
    sound.cry(202);
    await settle();
    expect(started()).toHaveLength(1);
    // The slow one arrives after the newer one is already playing, and stays silent.
    pending[201]();
    await settle();
    expect(started()).toHaveLength(1);
  });

  it("is cut off by a jingle, and a cry still on its way is dropped", async () => {
    sound.cry(301);
    await settle();
    const [cry] = sources;
    pending[302] = () => {};
    sound.cry(302);
    sound.playJingle("evolved");
    expect(cry.stop).toHaveBeenCalled();
    pending[302]();
    await settle();
    expect(started()).toHaveLength(1);
  });

  it("lets a cry asked for after a jingle play, which is how the evolution goes", async () => {
    sound.playJingle("evolved");
    sound.cry(401, 0.2);
    await settle();
    expect(started()).toHaveLength(1);
    expect(sources[0].start).toHaveBeenCalledWith(5.2);
  });

  it("makes no sound at all while sound is off", async () => {
    sound.setEnabled(false);
    sound.cry(501);
    await settle();
    expect(started()).toHaveLength(0);
  });
});
