/**
 * Turns the town and rooms in content/world.ts into playable maps: collision,
 * doors, readable things, and a painter for the parts that never move.
 */
import { experience, profile, projects, rooms, site, town } from "@content";
import type {
  CastMember,
  Furniture,
  Interaction,
  RoomId,
  RoomSpec,
  TownSpec,
} from "@content/types";
import { BUILDINGS } from "@/art/buildings";
import { avatarLook, LOOKS, type CharacterLook } from "@/art/characters";
import * as room from "@/art/interior";
import { TYPE_COLORS } from "@/art/palette";
import type { PixelBuffer } from "@/art/pixel-buffer";
import { FENCE_TILE, MAILBOX_TILE, ROCK_TILE, SIGN_TILE } from "@/art/props";
import { paintGround, paintObjects, treesFromGround, type Placed } from "@/art/scene";
import { TILE } from "@/art/terrain";
import { formatRange } from "@/lib/dates";
import { fill } from "../text";
import { tileIndex, type MapId, type RuntimeMap, type Spot } from "./runtime";

export function lookFor(member: CastMember): CharacterLook {
  return member === "professor" ? avatarLook(site.avatar) : LOOKS[member];
}

type MapBase = Omit<RuntimeMap, "npcs" | "start" | "paint">;

function blankMap(
  id: MapId,
  name: string,
  outdoor: boolean,
  width: number,
  height: number,
): MapBase {
  const size = width * height;
  return {
    id,
    name: fill(name),
    outdoor,
    width,
    height,
    solid: new Uint8Array(size),
    grass: new Uint8Array(size),
    counter: new Uint8Array(size),
    warps: new Map(),
    reads: new Map(),
    hints: new Map(),
    doors: new Map(),
    edges: new Set(),
    edge: [],
    flowers: [],
  };
}

// ---------------------------------------------------------------- rooms

/** The exit mat: the middle tile(s) of the bottom row. */
export function roomExits(spec: RoomSpec): number[] {
  const mid = Math.floor((spec.width - 1) / 2);
  return spec.width % 2 === 0 ? [mid, mid + 1] : [mid];
}

/** Where you stand after walking in: just above the exit mat, facing in. */
export function roomEntry(spec: RoomSpec): Spot {
  return { x: roomExits(spec)[0], y: spec.height - 2, facing: "up" };
}

const WALL_ITEMS = new Set<Furniture["item"]>(["window", "poster", "diploma", "certificate"]);
/** Two tiles tall, so nobody can stand where their top half is drawn. */
const TALL_ITEMS = new Set<Furniture["item"]>(["pedestal", "statue"]);

/** Tiles a piece of furniture blocks. */
function footprint(item: Furniture): Array<[number, number]> {
  if (WALL_ITEMS.has(item.item) || item.item === "rug" || item.item === "healer") return [];
  if (TALL_ITEMS.has(item.item)) {
    return [
      [item.x, item.y - 1],
      [item.x, item.y],
    ];
  }
  const width = "width" in item ? item.width : 1;
  const height = item.item === "bed" ? 2 : "height" in item ? (item.height ?? 1) : 1;
  const tiles: Array<[number, number]> = [];
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) tiles.push([item.x + dx, item.y + dy]);
  }
  return tiles;
}

/** What reading a piece of furniture says, falling back to text built from the résumé. */
function defaultRead(item: Furniture): Interaction | undefined {
  if (item.read) return item.read;
  if (item.item === "machine") {
    const project = projects.find((p) => p.id === item.project);
    if (!project) throw new Error(`Lab machine refers to unknown project "${item.project}"`);
    return {
      lines: [`It's a research machine.`, `It holds data on ${project.name.toUpperCase()}!`],
      then: { screen: "dex", project: project.id },
    };
  }
  if (item.item === "pedestal") {
    const job = experience.find((j) => j.id === item.job);
    if (!job) throw new Error(`Gym pedestal refers to unknown job "${item.job}"`);
    return {
      lines: [job.company.toUpperCase(), `${job.role}, ${formatRange(job.start, job.end)}.`],
      then: { screen: "party", job: job.id },
    };
  }
  if (item.item === "diploma") {
    const ed = profile.education[0];
    return ed
      ? {
          lines: [
            `It's a diploma!`,
            `${ed.degree.toUpperCase()}, ${ed.field}.`,
            `${ed.institution}, ${formatRange(ed.start, ed.end)}.`,
          ],
        }
      : undefined;
  }
  if (item.item === "certificate") {
    const cert = profile.certifications[0];
    return cert ? { lines: [`It's a certificate!`, `${cert.name}: ${cert.detail}.`] } : undefined;
  }
  return undefined;
}

function paintFurniture(buf: PixelBuffer, item: Furniture): void {
  const px = item.x * TILE;
  const py = item.y * TILE;
  switch (item.item) {
    case "window":
      return room.paintInteriorWindow(buf, px, 5);
    case "poster":
      return room.paintPoster(buf, px + 2, 6, ["#5fb4e8", "#e5463d"]);
    case "diploma":
    case "certificate":
      return room.paintFrame(buf, px + 2, 5, item.item);
    case "bookshelf":
      return room.paintBookshelf(buf, px, py - 18);
    case "shelf":
      return room.paintShelf(buf, px, py - 18);
    case "machine": {
      const project = projects.find((p) => p.id === item.project);
      const type = project?.mascot.types?.[0] ?? "normal";
      return room.paintMachine(buf, px, py - 14, TYPE_COLORS[type]);
    }
    case "pc":
      room.paintDesk(buf, px, py + 7);
      return room.paintPC(buf, px, py - 8);
    case "tv":
      return room.paintTV(buf, px, py - 4);
    case "plant":
      return room.paintPlant(buf, px, py - 4);
    case "bed":
      return room.paintBed(buf, px, py);
    case "table":
      room.paintTable(buf, px, py - 2, item.width * TILE, 18);
      return room.paintPapers(buf, px + 4, py - 1);
    case "counter":
      return room.paintCounter(buf, px, py, item.width * TILE, TILE);
    case "rug":
      return room.paintRug(buf, px, py, item.width * TILE, (item.height ?? 1) * TILE - 2);
    case "healer":
      return room.paintHealMachine(buf, px + 2, py - 10);
    case "pedestal": {
      const job = experience.find((j) => j.id === item.job);
      const type = job?.mascot.types?.[1] ?? job?.mascot.types?.[0] ?? "normal";
      return room.paintPedestal(buf, px, py - 12, TYPE_COLORS[type]);
    }
    case "statue":
      return room.paintStatue(buf, px, py - 12);
  }
}

/** Draw order within a room: rugs flat on the floor first, wall pieces, then by where things stand. */
function paintRank(item: Furniture): number {
  if (item.item === "rug") return -2;
  if (WALL_ITEMS.has(item.item)) return -1;
  if (item.item === "healer") return 99;
  return item.y + (item.item === "bed" ? 2 : 1);
}

export function compileRoom(id: RoomId, spec: RoomSpec, doorFront: Spot): RuntimeMap {
  const map = blankMap(id, spec.name, false, spec.width, spec.height);
  const at = (x: number, y: number) => tileIndex(map, x, y);

  for (let x = 0; x < spec.width; x++) {
    map.solid[at(x, 0)] = 1;
    map.solid[at(x, 1)] = 1;
  }
  const npcTiles = new Set(spec.npcs.map((npc) => at(npc.x, npc.y)));
  for (const item of spec.furniture) {
    for (const [x, y] of footprint(item)) {
      map.solid[at(x, y)] = 1;
      if (item.item !== "counter") continue;
      map.counter[at(x, y)] = 1;
      // Staff only behind the counter: block the space there, except where staff stand.
      if (y > 2 && !npcTiles.has(at(x, y - 1))) map.solid[at(x, y - 1)] = 1;
    }
    const read = defaultRead(item);
    if (!read) continue;
    const tiles: Array<[number, number]> = WALL_ITEMS.has(item.item)
      ? [[item.x, 1]]
      : footprint(item);
    for (const [x, y] of tiles) map.reads.set(at(x, y), read);
  }
  for (const x of roomExits(spec)) {
    map.warps.set(at(x, spec.height - 1), { to: "town", ...doorFront });
  }

  const floorTop = 2 * TILE;
  const ordered = [...spec.furniture].sort((a, b) => paintRank(a) - paintRank(b));
  return {
    ...map,
    npcs: spec.npcs,
    start: roomEntry(spec),
    paint(buf) {
      const w = spec.width * TILE;
      const h = spec.height * TILE;
      if (spec.floor === "wood") room.paintWoodFloor(buf, 0, floorTop, w, h - floorTop);
      else room.paintTileFloor(buf, 0, floorTop, w, h - floorTop);
      const wallStyle = spec.wall === "cool" ? room.INTERIOR.labWall : room.INTERIOR.wall;
      room.paintBackWall(buf, 0, 0, w, floorTop, wallStyle);
      for (const x of roomExits(spec)) room.paintExitMat(buf, x * TILE, (spec.height - 1) * TILE);
      for (const item of ordered) paintFurniture(buf, item);
    },
  };
}

// ---------------------------------------------------------------- the town

const GRID_PROPS = { sign: SIGN_TILE, mailbox: MAILBOX_TILE, rock: ROCK_TILE, fence: FENCE_TILE };

function townObjects(spec: TownSpec): Placed[] {
  const objects: Placed[] = treesFromGround(spec.ground);
  for (const b of spec.buildings)
    objects.push({ kind: "building", id: b.building, x: b.x, y: b.y });
  for (const p of spec.props) {
    if (p.prop in GRID_PROPS) {
      objects.push({
        kind: "tile",
        grid: GRID_PROPS[p.prop as keyof typeof GRID_PROPS],
        x: p.x,
        y: p.y,
      });
    } else {
      objects.push({ kind: p.prop as "bush" | "lamp" | "jobBoard", x: p.x, y: p.y });
    }
  }
  return objects;
}

/** Tiles a town prop blocks: the job board is 2×2 and a lamp's head fills the tile above it. */
function propTiles(p: TownSpec["props"][number]): Array<[number, number]> {
  if (p.prop === "jobBoard") {
    return [
      [p.x, p.y],
      [p.x + 1, p.y],
      [p.x, p.y + 1],
      [p.x + 1, p.y + 1],
    ];
  }
  if (p.prop === "lamp") {
    return [
      [p.x, p.y - 1],
      [p.x, p.y],
    ];
  }
  return [[p.x, p.y]];
}

export function compileTown(spec: TownSpec, roomSpecs: Record<RoomId, RoomSpec>): RuntimeMap {
  const width = spec.ground[0].length;
  const height = spec.ground.length;
  const map = blankMap("town", "{town}", true, width, height);
  const at = (x: number, y: number) => tileIndex(map, x, y);

  spec.ground.forEach((row, y) => {
    if (row.length !== width)
      throw new Error(`Town row ${y} is ${row.length} wide, expected ${width}`);
    [...row].forEach((ch, x) => {
      if (ch === "T") map.solid[at(x, y)] = 1;
      if (ch === '"') map.grass[at(x, y)] = 1;
      if (ch === "*") map.flowers.push({ x, y, color: "red" });
      if (ch === "+") map.flowers.push({ x, y, color: "yellow" });
    });
  });

  for (const b of spec.buildings) {
    const def = BUILDINGS[b.building];
    const doorX = b.x + def.door.x;
    const doorY = b.y + def.door.y;
    const door = at(doorX, doorY);
    for (let dy = 0; dy < def.heightTiles; dy++) {
      for (let dx = 0; dx < def.widthTiles; dx++) {
        const tile = at(b.x + dx, b.y + dy);
        map.solid[tile] = 1;
        map.doors.set(tile, door);
      }
    }
    map.solid[door] = 0;
    map.warps.set(door, { to: b.building, ...roomEntry(roomSpecs[b.building]) });
    map.hints.set(at(doorX, doorY + 1), fill(b.hint));
  }

  for (const p of spec.props) {
    for (const [x, y] of propTiles(p)) {
      map.solid[at(x, y)] = 1;
      if ("read" in p) map.reads.set(at(x, y), p.read);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (onEdge && !map.solid[at(x, y)]) map.edges.add(at(x, y));
    }
  }

  const objects = townObjects(spec);
  return {
    ...map,
    edge: spec.edge,
    npcs: spec.npcs,
    start: spec.start,
    paint(buf, lit) {
      paintGround(buf, spec.ground);
      paintObjects(buf, objects, lit);
    },
  };
}

// ---------------------------------------------------------------- everything

export type World = Record<MapId, RuntimeMap>;

export function buildWorld(townSpec: TownSpec = town, roomSpecs = rooms): World {
  const world = { town: compileTown(townSpec, roomSpecs) } as World;
  for (const b of townSpec.buildings) {
    const def = BUILDINGS[b.building];
    const doorFront: Spot = { x: b.x + def.door.x, y: b.y + def.door.y + 1, facing: "down" };
    world[b.building] = compileRoom(b.building, roomSpecs[b.building], doorFront);
  }
  return world;
}
