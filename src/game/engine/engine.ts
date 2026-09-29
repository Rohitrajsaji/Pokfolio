/**
 * The overworld. Runs a fixed 60 fps loop that moves the visitor and NPCs,
 * handles doors, tall grass and interactions, and draws a 256×192 view the
 * page scales up.
 */
import type { Direction, NpcSpec } from "@content/types";
import { bufferToCanvas } from "@/art/canvas";
import { characterFrame, type Step } from "@/art/characters";
import { gridToBuffer } from "@/art/grid";
import { GLOW_COLORS } from "@/art/palette";
import { PixelBuffer } from "@/art/pixel-buffer";
import { RED_FLOWER_FRAMES, TALL_GRASS_FRAMES, YELLOW_FLOWER_FRAMES } from "@/art/terrain";
import type { SfxName } from "../audio/sfx";
import { runInteraction } from "../state/interact";
import { useGame } from "../state/store";
import { fill } from "../text";
import { lookFor, type World } from "../world/compile";
import {
  OPPOSITE,
  STEP,
  inBounds,
  isSolid,
  tileIndex,
  type MapId,
  type RuntimeMap,
  type Spot,
} from "../world/runtime";
import type { Action, InputHub } from "./input";
import { findPath, findPathNextTo, type PathGrid } from "./path";
import { drawWipe } from "./wipe";
import { LIGHTING, type TimeOfDay } from "./time";
import {
  RUN_FRAMES,
  STROLL_FRAMES,
  TILE,
  WALK_FRAMES,
  advance,
  animationStep,
  beginStep,
  bumpInto,
  createWalker,
  occupies,
  pixelPosition,
  type Walker,
} from "./walker";

export const VIEW_WIDTH = 256;
export const VIEW_HEIGHT = 192;
const FRAME_MS = 1000 / 60;
/** Tapping a new direction turns on the spot; holding it this long starts walking. */
const TURN_FRAMES = 6;
const FADE_FRAMES = 12;
const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

interface Npc extends Walker {
  spec: NpcSpec;
  home: { x: number; y: number };
  timer: number;
}

export interface EngineHooks {
  /** The visitor stumbled on the wild ROHIT in the tall grass. Returns whether a battle began. */
  onEncounter(): boolean;
  /** Plays a sound effect (silent unless the visitor turned sound on). */
  sfx(name: SfxName): void;
  /** True while something else, like a battle, owns the screen. */
  busy(): boolean;
  reducedMotion(): boolean;
  timeOfDay(): TimeOfDay;
}

const randomInt = (n: number) => Math.floor(Math.random() * n);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A soft 12×4 shadow for under people's feet. */
function makeShadow(): HTMLCanvasElement {
  const canvas = bufferToCanvas(new PixelBuffer(12, 4));
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(12, 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 12; x++) {
      const nx = (x + 0.5 - 6) / 6;
      const ny = (y + 0.5 - 2) / 2;
      if (nx * nx + ny * ny <= 1) image.data.set([24, 24, 48, 80], (y * 12 + x) * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Just the pixels that give off light (lit windows, lamps), for drawing over the night tint. */
function glowOnly(buf: PixelBuffer): PixelBuffer {
  const out = new PixelBuffer(buf.width, buf.height);
  const glowing = new Set(GLOW_COLORS.map((c) => Number.parseInt(c.slice(1), 16)));
  const { data } = buf;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    if (glowing.has((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])) {
      out.data.set(data.subarray(i, i + 4), i);
    }
  }
  return out;
}

export class Engine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly player: Walker;
  private map: RuntimeMap;
  private npcs: Npc[] = [];
  private readonly layers = new Map<string, HTMLCanvasElement>();
  private readonly sprites = new Map<string, HTMLCanvasElement>();
  private readonly tiles: Record<"grass" | "red" | "yellow", HTMLCanvasElement[]>;
  private readonly shadow: HTMLCanvasElement;
  private raf = 0;
  private running = false;
  private lastTime = 0;
  private backlog = 0;
  private frame = 0;
  private turning = 0;
  private path: Direction[] = [];
  private arrival: { face: Direction; interact: boolean } | null = null;
  private fade: { phase: "out" | "in"; t: number; then?: () => void } | null = null;
  private rustle: { index: number; t: number } | null = null;
  private grassSteps = 0;
  private edgeShown = false;
  private camera = { x: 0, y: 0 };
  /** How much of the world is in view, in game pixels. Set by `resize`. */
  private viewW = VIEW_WIDTH;
  private viewH = VIEW_HEIGHT;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly world: World,
    private readonly input: InputHub,
    private readonly hooks: EngineHooks,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is not available");
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    const toCanvases = (frames: typeof TALL_GRASS_FRAMES) =>
      frames.map((grid) => bufferToCanvas(gridToBuffer(grid)));
    this.tiles = {
      grass: toCanvases(TALL_GRASS_FRAMES),
      red: toCanvases(RED_FLOWER_FRAMES),
      yellow: toCanvases(YELLOW_FLOWER_FRAMES),
    };
    this.shadow = makeShadow();
    const start = world.town.start;
    this.player = createWalker(
      "player",
      "player",
      lookFor("player"),
      start.x,
      start.y,
      start.facing,
    );
    this.map = world.town;
    this.enterMap("town", start);
  }

  // ---------------------------------------------------------------- lifecycle

  /** Shows `width`×`height` game pixels of the world: the canvas is exactly that size. */
  resize(width: number, height: number): void {
    if (width === this.viewW && height === this.viewH) return;
    this.viewW = width;
    this.viewH = height;
    this.canvas.width = width;
    this.canvas.height = height;
    // Resizing a canvas resets its drawing state.
    this.ctx.imageSmoothingEnabled = false;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.input.setBase(this.onPress);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.raf = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.setBase(null);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private onVisibility = () => {
    this.lastTime = 0;
    this.input.releaseAll();
  };

  private loop = (time: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.lastTime === 0) this.lastTime = time;
    this.backlog += Math.min(time - this.lastTime, 250);
    this.lastTime = time;
    let steps = 0;
    while (this.backlog >= FRAME_MS && steps < 4) {
      this.update();
      this.backlog -= FRAME_MS;
      steps++;
    }
    if (steps === 4) this.backlog = 0;
    this.render();
  };

  // ---------------------------------------------------------------- maps

  private enterMap(id: MapId, spot: Spot): void {
    this.map = this.world[id];
    Object.assign(this.player, { x: spot.x, y: spot.y, facing: spot.facing, move: null, bump: 0 });
    this.npcs = this.map.npcs.map((spec) => ({
      ...createWalker(spec.id, spec.look, lookFor(spec.look), spec.x, spec.y, spec.facing),
      spec,
      home: { x: spec.x, y: spec.y },
      timer: 60 + randomInt(120),
    }));
    this.path = [];
    this.arrival = null;
    this.grassSteps = 0;
    this.rustle = null;
    useGame.getState().setMap(id);
    this.reportTile();
  }

  /** Moves the visitor to another map (or spot), with a fade. Used by the Town Map. */
  warpTo(id: MapId, spot: Spot = this.world[id].start): void {
    this.startFade(() => this.enterMap(id, spot));
  }

  private startFade(then: () => void): void {
    if (this.hooks.reducedMotion()) return then();
    this.fade = { phase: "out", t: 0, then };
  }

  // ---------------------------------------------------------------- update

  private update(): void {
    this.frame++;
    if (this.fade) {
      this.fade.t++;
      if (this.fade.t < FADE_FRAMES) return;
      if (this.fade.phase === "out") {
        this.fade.then?.();
        this.fade = { phase: "in", t: 0 };
      } else {
        this.fade = null;
      }
      return;
    }

    const arrived = advance(this.player);
    for (const npc of this.npcs) advance(npc);
    if (arrived) this.onArrive();
    if (this.rustle && --this.rustle.t <= 0) this.rustle = null;
    if (this.fade || useGame.getState().overlay || this.hooks.busy()) {
      this.turning = 0;
      return;
    }
    if (!this.player.move) this.steer(arrived);
    for (const npc of this.npcs) this.wander(npc);
  }

  private steer(justArrived: boolean): void {
    const p = this.player;
    const held = this.input.direction();
    if (held) {
      this.path = [];
      this.arrival = null;
      if (p.facing !== held && !justArrived && this.turning === 0) {
        p.facing = held;
        this.turning = TURN_FRAMES;
        return;
      }
      if (this.turning > 0 && --this.turning > 0) return;
      this.turning = 0;
      this.tryStep(held);
      return;
    }
    this.turning = 0;
    if (this.path.length > 0) {
      if (!this.tryStep(this.path.shift()!)) {
        this.path = [];
        this.arrival = null;
      }
      return;
    }
    if (this.arrival) {
      const { face, interact } = this.arrival;
      this.arrival = null;
      p.facing = face;
      if (interact) this.interact();
    }
  }

  private tryStep(dir: Direction): boolean {
    const p = this.player;
    const nx = p.x + STEP[dir].dx;
    const ny = p.y + STEP[dir].dy;
    p.facing = dir;
    if (!inBounds(this.map, nx, ny)) {
      const onEdge = this.map.edges.has(tileIndex(this.map, p.x, p.y));
      if (onEdge && !this.edgeShown && this.map.edge.length > 0) {
        this.edgeShown = true;
        this.path = [];
        useGame.getState().say({ pages: this.map.edge.map(fill) });
      } else {
        this.bump(dir);
      }
      return false;
    }
    if (this.blocked(nx, ny, p)) {
      this.bump(dir);
      return false;
    }
    // Shift on a keyboard, or holding B like the handhelds' running shoes.
    const running = this.input.isHeld("run") || this.input.isHeld("b");
    beginStep(p, dir, running ? RUN_FRAMES : WALK_FRAMES);
    return true;
  }

  /** Walking into something: the bump animation, with a thud each time it starts. */
  private bump(dir: Direction): void {
    if (this.player.bump === 0) this.hooks.sfx("bump");
    bumpInto(this.player, dir);
  }

  private onArrive(): void {
    const p = this.player;
    const index = tileIndex(this.map, p.x, p.y);
    this.edgeShown = false;
    this.reportTile();
    const warp = this.map.warps.get(index);
    if (warp) {
      this.path = [];
      this.arrival = null;
      this.hooks.sfx("door");
      this.startFade(() => this.enterMap(warp.to, warp));
      return;
    }
    if (this.map.grass[index] === 1) {
      this.rustle = { index, t: 12 };
      this.grassSteps++;
      if (this.grassSteps >= 2 && (Math.random() < 0.3 || this.grassSteps >= 5)) {
        this.grassSteps = 0;
        if (this.hooks.onEncounter()) {
          this.path = [];
          this.arrival = null;
        }
      }
    }
  }

  private wander(npc: Npc): void {
    const radius = npc.spec.wander ?? 0;
    if (radius === 0 || npc.move || --npc.timer > 0) return;
    npc.timer = 80 + randomInt(160);
    const dir = DIRECTIONS[randomInt(DIRECTIONS.length)];
    const nx = npc.x + STEP[dir].dx;
    const ny = npc.y + STEP[dir].dy;
    const index = tileIndex(this.map, nx, ny);
    const tooFar = Math.abs(nx - npc.home.x) + Math.abs(ny - npc.home.y) > radius;
    // Strollers keep out of doorways.
    const doorway = this.map.warps.has(index) || this.map.hints.has(index);
    if (tooFar || this.blocked(nx, ny, npc) || doorway) {
      npc.facing = dir;
      return;
    }
    beginStep(npc, dir, STROLL_FRAMES);
  }

  private blocked(x: number, y: number, self: Walker): boolean {
    if (isSolid(this.map, x, y)) return true;
    if (self !== this.player && occupies(this.player, x, y)) return true;
    return this.npcs.some((npc) => npc !== self && occupies(npc, x, y));
  }

  private npcAt(x: number, y: number): Npc | undefined {
    return this.npcs.find((npc) => occupies(npc, x, y));
  }

  /** Tells the UI where the visitor now stands, and which door (if any) they face. */
  private reportTile(): void {
    const { x, y } = this.player;
    const game = useGame.getState();
    game.setPosition({ x, y });
    const hint = this.map.hints.get(tileIndex(this.map, x, y)) ?? null;
    if (game.hint !== hint) game.setHint(hint);
  }

  // ---------------------------------------------------------------- interaction

  private onPress = (action: Action): void => {
    if (this.fade || useGame.getState().overlay || this.hooks.busy()) return;
    if (action === "a") {
      this.path = [];
      this.arrival = null;
      if (!this.player.move) this.interact();
    } else if (action === "start" || action === "escape") {
      this.path = [];
      this.arrival = null;
      this.hooks.sfx("menu");
      useGame.getState().openMenu();
    }
  };

  private interact(): void {
    const p = this.player;
    const { dx, dy } = STEP[p.facing];
    const tx = p.x + dx;
    const ty = p.y + dy;
    if (!inBounds(this.map, tx, ty)) return;
    let npc = this.npcAt(tx, ty);
    if (!npc && this.map.counter[tileIndex(this.map, tx, ty)] === 1) {
      npc = this.npcAt(tx + dx, ty + dy);
    }
    if (npc) {
      if (!npc.move) npc.facing = OPPOSITE[p.facing];
      runInteraction(npc.spec.talk, npc.spec.name);
      return;
    }
    const read = this.map.reads.get(tileIndex(this.map, tx, ty));
    if (read) runInteraction(read);
  }

  /** Walks the visitor to whatever was tapped, and uses it if it can be used. */
  tap(clientX: number, clientY: number): void {
    if (this.fade || useGame.getState().overlay || this.hooks.busy()) return;
    const rect = this.canvas.getBoundingClientRect();
    const gx = ((clientX - rect.left) / rect.width) * this.viewW + this.camera.x;
    const gy = ((clientY - rect.top) / rect.height) * this.viewH + this.camera.y;
    const tx = Math.floor(gx / TILE);
    const ty = Math.floor(gy / TILE);
    if (!inBounds(this.map, tx, ty)) return;
    const p = this.player;
    const index = tileIndex(this.map, tx, ty);

    const door = this.map.doors.get(index);
    if (door !== undefined) {
      const at = { x: door % this.map.width, y: Math.floor(door / this.map.width) };
      this.follow(findPath(this.grid(door), p, at), null);
      return;
    }
    const usable = Boolean(this.npcAt(tx, ty) || this.map.reads.has(index));
    if (usable || isSolid(this.map, tx, ty)) {
      const grid = this.grid();
      const plan = findPathNextTo(grid, p, { x: tx, y: ty }) ?? this.acrossCounter(grid, tx, ty);
      if (plan) this.follow(plan.path, { face: plan.face, interact: usable });
      return;
    }
    if (tx === p.x && ty === p.y) return;
    this.follow(findPath(this.grid(index), p, { x: tx, y: ty }), null);
  }

  /** A walk to the far side of a counter from (tx, ty), for talking across it. */
  private acrossCounter(grid: PathGrid, tx: number, ty: number) {
    let best: ReturnType<typeof findPathNextTo> = null;
    for (const dir of DIRECTIONS) {
      const cx = tx + STEP[dir].dx;
      const cy = ty + STEP[dir].dy;
      if (!inBounds(this.map, cx, cy) || this.map.counter[tileIndex(this.map, cx, cy)] !== 1) {
        continue;
      }
      const plan = findPathNextTo(grid, this.player, { x: cx, y: cy });
      if (plan && (!best || plan.path.length < best.path.length)) best = plan;
    }
    return best;
  }

  /** Walkable tiles for path finding; doors count only when `allow` is that door. */
  private grid(allow?: number): PathGrid {
    const map = this.map;
    return {
      width: map.width,
      height: map.height,
      passable: (x, y) => {
        if (isSolid(map, x, y)) return false;
        const index = tileIndex(map, x, y);
        if (map.warps.has(index) && index !== allow) return false;
        return !this.npcs.some((npc) => occupies(npc, x, y));
      },
    };
  }

  private follow(path: Direction[] | null, arrival: Engine["arrival"]): void {
    if (!path) return;
    this.path = path;
    this.arrival = arrival;
  }

  // ---------------------------------------------------------------- drawing

  private layer(map: RuntimeMap, lit: boolean): HTMLCanvasElement {
    const key = `${map.id}:${lit ? "night" : "day"}`;
    let canvas = this.layers.get(key);
    if (canvas) return canvas;
    const buf = new PixelBuffer(map.width * TILE, map.height * TILE);
    map.paint(buf, lit);
    canvas = bufferToCanvas(buf);
    this.layers.set(key, canvas);
    if (lit) this.layers.set(`${map.id}:glow`, bufferToCanvas(glowOnly(buf)));
    return canvas;
  }

  private sprite(w: Walker, step: Step): HTMLCanvasElement {
    const key = `${w.lookKey}:${w.facing}:${step}`;
    let canvas = this.sprites.get(key);
    if (!canvas) {
      canvas = bufferToCanvas(characterFrame(w.look, w.facing, step));
      this.sprites.set(key, canvas);
    }
    return canvas;
  }

  private render(): void {
    const { ctx, map } = this;
    const light = map.outdoor ? LIGHTING[this.hooks.timeOfDay()] : { tint: null, lit: false };
    const { px, py } = pixelPosition(this.player);
    const mapWidth = map.width * TILE;
    const mapHeight = map.height * TILE;
    const camX =
      mapWidth <= this.viewW
        ? -Math.floor((this.viewW - mapWidth) / 2)
        : clamp(px + 8 - this.viewW / 2, 0, mapWidth - this.viewW);
    const camY =
      mapHeight <= this.viewH
        ? -Math.floor((this.viewH - mapHeight) / 2)
        : clamp(py + 8 - this.viewH / 2, 0, mapHeight - this.viewH);
    this.camera = { x: camX, y: camY };

    ctx.fillStyle = "#0c0d14";
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    ctx.drawImage(this.layer(map, light.lit), -camX, -camY);

    const sway = Math.floor(this.frame / 32) % 2;
    for (const f of map.flowers) {
      ctx.drawImage(this.tiles[f.color][sway], f.x * TILE - camX, f.y * TILE - camY);
    }
    if (this.rustle) {
      const x = this.rustle.index % map.width;
      const y = Math.floor(this.rustle.index / map.width);
      ctx.drawImage(this.tiles.grass[1], x * TILE - camX, y * TILE - camY);
    }

    const walkers: Walker[] = [...this.npcs, this.player];
    walkers.sort((a, b) => pixelPosition(a).py - pixelPosition(b).py);
    for (const w of walkers) this.drawWalker(w, camX, camY);

    if (light.tint) {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = light.tint;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
      ctx.globalCompositeOperation = "source-over";
      const glow = this.layers.get(`${map.id}:glow`);
      if (light.lit && glow) ctx.drawImage(glow, -camX, -camY);
    }

    if (this.fade) {
      const t = this.fade.t / FADE_FRAMES;
      drawWipe(ctx, this.viewW, this.viewH, this.fade.phase === "out" ? t : 1 - t);
    }
  }

  private drawWalker(w: Walker, camX: number, camY: number): void {
    const { px, py } = pixelPosition(w);
    this.ctx.drawImage(this.shadow, px + 2 - camX, py + 13 - camY);
    this.ctx.drawImage(this.sprite(w, animationStep(w)), px - camX, py - 4 - camY);
    // Tall grass hides the feet of whoever stands in it.
    const row = Math.floor((py + 15) / TILE);
    for (const col of new Set([Math.floor((px + 3) / TILE), Math.floor((px + 12) / TILE)])) {
      if (!inBounds(this.map, col, row)) continue;
      const index = tileIndex(this.map, col, row);
      if (this.map.grass[index] !== 1) continue;
      const frame = this.rustle?.index === index ? 1 : 0;
      this.ctx.drawImage(
        this.tiles.grass[frame],
        0,
        9,
        TILE,
        7,
        col * TILE - camX,
        row * TILE + 9 - camY,
        TILE,
        7,
      );
    }
  }
}
