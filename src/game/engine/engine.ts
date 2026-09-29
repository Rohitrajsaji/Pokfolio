/**
 * The overworld. Runs a fixed 60 fps loop that moves the visitor and NPCs,
 * handles doors, tall grass and interactions, and draws a 256×192 view the
 * page scales up.
 */
import type { Direction, Interaction, NpcSpec, SecretId } from "@content/types";
import { bufferToCanvas } from "@/art/canvas";
import { characterFrame, type Step } from "@/art/characters";
import { gridToBuffer } from "@/art/grid";
import { DUST, FLOWER, GLOW_COLORS, OUTLINE } from "@/art/palette";
import { PixelBuffer } from "@/art/pixel-buffer";
import {
  RED_FLOWER_FRAMES,
  TALL_GRASS_FRAMES,
  YELLOW_FLOWER_FRAMES,
  paintWater,
} from "@/art/terrain";
import type { SfxName } from "../audio/sfx";
import { runInteraction } from "../state/interact";
import { hash2 } from "@/art/noise";
import { useGame } from "../state/store";
import { fill } from "../text";
import { applySecrets, lookFor, playerLook, type World } from "../world/compile";
import { walkedRoute } from "../world/routes";
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
import { cameraFor } from "./camera";
import type { Action, InputHub } from "./input";
import {
  DOOR_FRAMES,
  DUST_FRAMES,
  doorGap,
  dustPuff,
  idle,
  snore,
  untilNextGlance,
  zGlyph,
  type Rect,
} from "./life";
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
  /** Frames left of looking the other way, for someone who stands still (see `idle` in life.ts). */
  glance: number;
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
  private readonly borders = new Map<string, CanvasPattern | null>();
  private stopWatchingSecrets: (() => void) | null = null;
  /** The tiles the visitor has just walked onto in the town, newest last, for secret routes. */
  private recentTiles: number[] = [];
  private glitch: { id: number; start: number } | null = null;
  private scratch: HTMLCanvasElement | null = null;
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
  /** Puffs of dust the visitor kicked up running: where (in pixels) and how many frames ago. */
  private dust: Array<{ x: number; y: number; age: number }> = [];
  /** A door standing open: while the visitor goes in, and for a moment after they come out. */
  private doorOpen: { index: number; frames: number } | null = null;
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
    const dressed = useGame.getState().cosmetics.look;
    this.player = createWalker(
      "player",
      `player:${dressed}`,
      playerLook(dressed),
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
    this.stopWatchingSecrets = useGame.subscribe((state, last) => {
      if (state.secrets !== last.secrets) this.openSecrets(state.secrets);
      if (state.cosmetics.look !== last.cosmetics.look) this.dress(state.cosmetics.look);
    });
    this.raf = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    this.stopWatchingSecrets?.();
    this.stopWatchingSecrets = null;
    cancelAnimationFrame(this.raf);
    this.input.setBase(null);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  /** The visitor picked a different look: their sprite changes, and its pictures are drawn afresh. */
  private dress(id: string): void {
    this.player.look = playerLook(id);
    this.player.lookKey = `player:${id}`;
  }

  /** A secret was found: rooms with a staircase it opens are made again, and their pictures drawn afresh. */
  private openSecrets(secrets: readonly SecretId[]): void {
    for (const id of applySecrets(this.world, secrets)) {
      for (const key of ["day", "night", "glow"]) this.layers.delete(`${id}:${key}`);
      // The visitor may be standing in it: same room, same people, new walls.
      if (this.map.id === id) this.map = this.world[id];
    }
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
      // Strollers wait a moment before their first stroll; those who stand still, before their first glance.
      timer: (spec.wander ?? 0) > 0 ? 60 + randomInt(120) : untilNextGlance(Math.random),
      glance: 0,
    }));
    this.path = [];
    this.arrival = null;
    this.grassSteps = 0;
    this.rustle = null;
    this.recentTiles = [];
    this.dust = [];
    // Coming out of a building, its door stands open for a moment behind the visitor.
    this.doorOpen = null;
    const door = tileIndex(this.map, spot.x, spot.y - 1);
    if (this.map.outdoor && this.map.warps.has(door) && !this.hooks.reducedMotion()) {
      this.doorOpen = { index: door, frames: DOOR_FRAMES };
    }
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
    // Dust settles even while something else has the screen, so it never hangs in the air.
    for (const puff of this.dust) puff.age++;
    this.dust = this.dust.filter((puff) => puff.age < DUST_FRAMES);
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
    // The door that was opened swings shut again (it stays open through a fade, which returns above).
    if (this.doorOpen && --this.doorOpen.frames <= 0) this.doorOpen = null;
    if (this.fade || useGame.getState().overlay || this.hooks.busy()) {
      this.turning = 0;
      return;
    }
    if (!this.player.move) this.steer(arrived);
    for (const npc of this.npcs) {
      this.wander(npc);
      this.lookAbout(npc);
    }
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
    if (running) this.kickUpDust(p.x, p.y);
    beginStep(p, dir, running ? RUN_FRAMES : WALK_FRAMES);
    return true;
  }

  /** Running outdoors raises a puff of dust from the tile just left (not out of tall grass, and not with reduced motion). */
  private kickUpDust(tileX: number, tileY: number): void {
    if (!this.map.outdoor || this.hooks.reducedMotion()) return;
    if (this.map.grass[tileIndex(this.map, tileX, tileY)] === 1) return;
    this.dust.push({ x: tileX * TILE + TILE / 2, y: tileY * TILE + TILE - 2, age: 0 });
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
      // The door opens as the visitor steps through it, and stays open while the screen fades.
      if (this.map.outdoor && !this.hooks.reducedMotion()) {
        this.doorOpen = { index, frames: DOOR_FRAMES };
      }
      this.startFade(() => this.enterMap(warp.to, warp));
      return;
    }
    this.checkRoutes(index);
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

  /** Walking a secret route in the town, tile by tile, sets off its effect (once per visit). */
  private checkRoutes(index: number): void {
    const routes = this.map.routes;
    if (!routes || routes.length === 0) return;
    this.recentTiles.push(index);
    if (this.recentTiles.length > 64) this.recentTiles.shift();
    for (const route of routes) {
      if (!walkedRoute(this.recentTiles, route.tiles)) continue;
      const game = useGame.getState();
      if (game.visits[`route:${route.id}`]) continue;
      game.visit(`route:${route.id}`);
      this.path = [];
      this.arrival = null;
      runInteraction({ effect: route.effect });
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

  /** Someone who stands still glances about now and then, and turns back (see `idle` in life.ts). */
  private lookAbout(npc: Npc): void {
    if (npc.move || (npc.spec.wander ?? 0) > 0 || this.hooks.reducedMotion()) return;
    const next = idle(
      { timer: npc.timer, glance: npc.glance, facing: npc.facing },
      npc.spec.facing,
      Math.random,
    );
    npc.timer = next.timer;
    npc.glance = next.glance;
    npc.facing = next.facing;
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
      runInteraction(npc.spec.talk, npc.spec.name, `${this.map.id}:${npc.spec.id}`);
      return;
    }
    const index = tileIndex(this.map, tx, ty);
    const read = this.map.reads.get(index);
    if (read) runInteraction(read, undefined, this.readKey(index, read));
  }

  /**
   * What counts as the same thing coming back: every tile of a big prop (Snorlax is 2×2) is one
   * thing, named for its first tile.
   */
  private readKey(index: number, read: Interaction): string {
    let first = index;
    for (const [tile, other] of this.map.reads) if (other === read && tile < first) first = tile;
    return `${this.map.id}:${first % this.map.width},${Math.floor(first / this.map.width)}`;
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

  /** One tile of pond in one of its two frames, drawn the first time it's needed. */
  private waterTile(
    mapId: string,
    tile: NonNullable<RuntimeMap["water"]>[number],
    frame: 0 | 1,
  ): HTMLCanvasElement {
    const key = `${mapId}:water:${tile.x},${tile.y}:${frame}`;
    let canvas = this.layers.get(key);
    if (!canvas) {
      const buf = new PixelBuffer(TILE, TILE);
      paintWater(buf, 0, 0, tile.nb, frame, tile.x * 7 + tile.y * 13);
      canvas = bufferToCanvas(buf);
      this.layers.set(key, canvas);
    }
    return canvas;
  }

  /** The pattern that fills the space beyond a small outdoor map, or null when it stays black. */
  private borderPattern(map: RuntimeMap): CanvasPattern | null {
    if (!map.border) return null;
    const key = `${map.id}:border`;
    let pattern = this.borders.get(key);
    if (pattern === undefined) {
      const buf = new PixelBuffer(map.border.size, map.border.size);
      map.border.paint(buf);
      pattern = this.ctx.createPattern(bufferToCanvas(buf), "repeat");
      this.borders.set(key, pattern);
    }
    return pattern;
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
    const { x: camX, y: camY } = cameraFor(
      { x: px + TILE / 2, y: py + TILE / 2 },
      { width: map.width * TILE, height: map.height * TILE },
      { width: this.viewW, height: this.viewH },
    );
    this.camera = { x: camX, y: camY };

    ctx.fillStyle = "#0c0d14";
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    const border = this.borderPattern(map);
    const mapWidth = map.width * TILE;
    const mapHeight = map.height * TILE;
    if (
      border &&
      (camX < 0 || camY < 0 || camX + this.viewW > mapWidth || camY + this.viewH > mapHeight)
    ) {
      // Beyond the map's edge: the border repeated from the map's own corner, on whole pixels.
      ctx.save();
      ctx.translate(-camX, -camY);
      ctx.fillStyle = border;
      ctx.fillRect(camX, camY, this.viewW, this.viewH);
      ctx.restore();
    }
    ctx.drawImage(this.layer(map, light.lit), -camX, -camY);

    const sway = Math.floor(this.frame / 32) % 2;
    for (const f of map.flowers) {
      ctx.drawImage(this.tiles[f.color][sway], f.x * TILE - camX, f.y * TILE - camY);
    }
    // The pond's ripples: a new picture every so often, or a still one with reduced motion.
    const ripple = this.hooks.reducedMotion() ? 0 : ((Math.floor(this.frame / 24) % 2) as 0 | 1);
    for (const w of map.water ?? []) {
      ctx.drawImage(this.waterTile(map.id, w, ripple), w.x * TILE - camX, w.y * TILE - camY);
    }
    if (this.rustle) {
      const x = this.rustle.index % map.width;
      const y = Math.floor(this.rustle.index / map.width);
      ctx.drawImage(this.tiles.grass[1], x * TILE - camX, y * TILE - camY);
    }
    this.drawDoor(camX, camY);
    for (const puff of this.dust) {
      this.fillRects(dustPuff(puff.age), puff.x - camX, puff.y - camY, DUST.light, DUST.shade);
    }

    const walkers: Walker[] = [...this.npcs, this.player];
    walkers.sort((a, b) => pixelPosition(a).py - pixelPosition(b).py);
    for (const w of walkers) this.drawWalker(w, camX, camY);
    this.drawSnoring(camX, camY);

    if (light.tint) {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = light.tint;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
      ctx.globalCompositeOperation = "source-over";
      const glow = this.layers.get(`${map.id}:glow`);
      if (light.lit && glow) {
        // Lit doors and windows shine, but never over anyone standing in front of them.
        ctx.save();
        const clear = new Path2D();
        clear.rect(0, 0, this.viewW, this.viewH);
        for (const w of walkers) {
          const { px, py } = pixelPosition(w);
          clear.rect(px - camX, py - 4 - camY, TILE, 20);
        }
        ctx.clip(clear, "evenodd");
        ctx.drawImage(glow, -camX, -camY);
        ctx.restore();
      }
    }

    this.drawGlitch();

    if (this.fade) {
      const t = this.fade.t / FADE_FRAMES;
      drawWipe(ctx, this.viewW, this.viewH, this.fade.phase === "out" ? t : 1 - t);
    }
  }

  /**
   * While the MissingNo. cameo is up, the picture comes apart: horizontal slices of the screen slide
   * sideways (wrapping round), and a few dull blocks of static appear. It changes four times a second
   * at most, stays close to the town's own colours, and is a single fixed picture with reduced motion.
   */
  private drawGlitch(): void {
    const overlay = useGame.getState().overlay;
    if (overlay?.kind !== "cameo" || overlay.cameo !== "missingno") {
      this.glitch = null;
      return;
    }
    if (this.glitch?.id !== overlay.id) this.glitch = { id: overlay.id, start: this.frame };
    const step = this.hooks.reducedMotion() ? 1 : Math.floor((this.frame - this.glitch.start) / 15);
    const { viewW: w, viewH: h, ctx } = this;
    if (!this.scratch || this.scratch.width !== w || this.scratch.height !== h) {
      this.scratch = document.createElement("canvas");
      this.scratch.width = w;
      this.scratch.height = h;
    }
    const copy = this.scratch.getContext("2d")!;
    copy.clearRect(0, 0, w, h);
    copy.drawImage(this.canvas, 0, 0);
    const bands = 9;
    const bandHeight = Math.ceil(h / bands);
    for (let i = 0; i < bands; i++) {
      const roll = hash2(i, step, 3);
      if (roll < 0.35) continue;
      const shift = Math.round((hash2(i, step, 4) - 0.5) * 2 * 24);
      const y = i * bandHeight;
      const rows = Math.min(bandHeight, h - y);
      for (const dx of [shift, shift - Math.sign(shift) * w]) {
        ctx.drawImage(this.scratch, 0, y, w, rows, dx, y, w, rows);
      }
    }
    for (let k = 0; k < 6; k++) {
      const bx = Math.floor(hash2(k, step, 8) * (w / 8)) * 8;
      const by = Math.floor(hash2(k, step, 9) * (h / 8)) * 8;
      ctx.fillStyle = hash2(k, step, 10) < 0.5 ? "#101010" : "#7a7a7a";
      ctx.fillRect(bx, by, 8, 8);
    }
  }

  /** Fills a set of rectangles (see life.ts) round a point, in the light colour, or the darker one for shaded ones. */
  private fillRects(rects: Rect[], x: number, y: number, light: string, shade: string): void {
    for (const r of rects) {
      this.ctx.fillStyle = r.shade ? shade : light;
      this.ctx.fillRect(x + r.x, y + r.y, r.w, r.h);
    }
  }

  /** A door standing open: a dark doorway where the door was, narrowing as it swings shut. */
  private drawDoor(camX: number, camY: number): void {
    const door = this.doorOpen;
    if (!door) return;
    const gap = doorGap(door.frames);
    if (gap === 0) return;
    const x = (door.index % this.map.width) * TILE - camX + (TILE - gap) / 2;
    const y = Math.floor(door.index / this.map.width) * TILE - camY;
    this.ctx.fillStyle = OUTLINE;
    this.ctx.fillRect(x, y + 2, gap, TILE - 3);
  }

  /** A sleeper's snores: a small 'z' and then a big one rise from its head, white with a dark edge. */
  private drawSnoring(camX: number, camY: number): void {
    const spots = this.map.snoring;
    if (!spots || spots.length === 0) return;
    const still = this.hooks.reducedMotion();
    for (const spot of spots) {
      for (const n of [0, 1] as const) {
        const z = snore(this.frame, n, still);
        if (!z) continue;
        const x = spot.x - camX + z.dx;
        const y = spot.y - camY + z.dy;
        const glyph = zGlyph(z.big);
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          this.fillRects(glyph, x + dx, y + dy, OUTLINE, OUTLINE);
        }
        this.fillRects(glyph, x, y, FLOWER.white, FLOWER.white);
      }
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
