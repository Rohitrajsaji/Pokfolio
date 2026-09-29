import { projects, rooms, town } from "@content";
import type { RoomId } from "@content/types";
import { describe, expect, it } from "vitest";
import { buildWorld, roomExits } from "./compile";
import { STEP, inBounds, isSolid, tileIndex, type RuntimeMap } from "./runtime";

const world = buildWorld();

/** Tiles reachable on foot from the map's start. Doors are destinations, not corridors. */
function reachable(map: RuntimeMap): Set<number> {
  const seen = new Set([tileIndex(map, map.start.x, map.start.y)]);
  const queue: Array<[number, number]> = [[map.start.x, map.start.y]];
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    for (const { dx, dy } of Object.values(STEP)) {
      const nx = x + dx;
      const ny = y + dy;
      if (isSolid(map, nx, ny)) continue;
      const next = tileIndex(map, nx, ny);
      if (seen.has(next)) continue;
      seen.add(next);
      if (!map.warps.has(next)) queue.push([nx, ny]);
    }
  }
  return seen;
}

/** You can use what's on a tile if you can stand next to it, or across a counter from it. */
function usable(map: RuntimeMap, reach: Set<number>, x: number, y: number): boolean {
  return Object.values(STEP).some(({ dx, dy }) => {
    const nx = x + dx;
    const ny = y + dy;
    if (!inBounds(map, nx, ny)) return false;
    const next = tileIndex(map, nx, ny);
    if (reach.has(next) && !map.warps.has(next)) return true;
    const fx = nx + dx;
    const fy = ny + dy;
    return map.counter[next] === 1 && inBounds(map, fx, fy) && reach.has(tileIndex(map, fx, fy));
  });
}

/** Every distinct readable thing, and whether at least one of its tiles can be used. */
function readables(map: RuntimeMap, reach: Set<number>) {
  const byInteraction = new Map<unknown, boolean>();
  for (const [index, interaction] of map.reads) {
    const x = index % map.width;
    const y = Math.floor(index / map.width);
    byInteraction.set(interaction, byInteraction.get(interaction) || usable(map, reach, x, y));
  }
  return byInteraction;
}

describe("the town", () => {
  const map = world.town;
  const reach = reachable(map);

  it("matches its ground map and starts on open ground", () => {
    expect([map.width, map.height]).toEqual([town.ground[0].length, town.ground.length]);
    expect(isSolid(map, map.start.x, map.start.y)).toBe(false);
  });

  it("has a reachable door into every room, each with a hint in front", () => {
    const doors = [...map.warps.entries()];
    expect(doors.map(([, warp]) => warp.to).sort()).toEqual([
      "center",
      "gym",
      "house",
      "lab",
      "mart",
    ]);
    for (const [index] of doors) {
      expect(reach.has(index), `door at tile ${index}`).toBe(true);
      expect(map.hints.has(index + map.width), `hint below door ${index}`).toBe(true);
    }
  });

  it("lets you read every sign and talk to everyone", () => {
    for (const [interaction, ok] of readables(map, reach)) {
      expect(ok, JSON.stringify(interaction)).toBe(true);
    }
    for (const npc of map.npcs) {
      expect(isSolid(map, npc.x, npc.y), npc.id).toBe(false);
      expect(usable(map, reach, npc.x, npc.y), npc.id).toBe(true);
    }
  });

  it("has tall grass you can walk into", () => {
    const grass = [...map.grass.keys()].filter((i) => map.grass[i] === 1);
    expect(grass.length).toBeGreaterThan(0);
    expect(grass.some((i) => reach.has(i))).toBe(true);
  });

  it("only lets you walk off the map along the road out", () => {
    expect(map.edges.size).toBeGreaterThan(0);
    for (const index of map.edges) expect(reach.has(index)).toBe(true);
  });

  it("maps every building tile to its door, for tap-to-walk", () => {
    for (const [tile, door] of map.doors) expect(map.warps.has(door), `tile ${tile}`).toBe(true);
  });
});

describe.each(Object.keys(rooms) as RoomId[])("the %s", (id) => {
  const map = world[id];
  const spec = rooms[id];
  const reach = reachable(map);

  it("starts you on open floor and can be left the way you came in", () => {
    expect(isSolid(map, map.start.x, map.start.y)).toBe(false);
    const exits = roomExits(spec).map((x) => tileIndex(map, x, spec.height - 1));
    expect(exits.some((exit) => reach.has(exit))).toBe(true);
  });

  it("leads back to the tile in front of its own door", () => {
    for (const x of roomExits(spec)) {
      const warp = map.warps.get(tileIndex(map, x, spec.height - 1));
      expect(warp?.to).toBe("town");
      const front = tileIndex(world.town, warp!.x, warp!.y);
      expect(isSolid(world.town, warp!.x, warp!.y)).toBe(false);
      expect(world.town.warps.get(front - world.town.width)?.to).toBe(id);
    }
  });

  it("lets you use every piece of furniture and talk to everyone", () => {
    for (const [interaction, ok] of readables(map, reach)) {
      expect(ok, JSON.stringify(interaction)).toBe(true);
    }
    for (const npc of map.npcs) {
      expect(isSolid(map, npc.x, npc.y), npc.id).toBe(false);
      expect(usable(map, reach, npc.x, npc.y), npc.id).toBe(true);
    }
  });
});

describe("content links", () => {
  it("has a Lab machine for every project, opening its Pokédex page", () => {
    const opened = [...world.lab.reads.values()]
      .map((read) => read.then)
      .filter((then) => then?.screen === "dex")
      .map((then) => (then as { project?: string }).project);
    expect(new Set(opened)).toEqual(new Set(projects.map((p) => p.id)));
  });

  it("rejects furniture that points at missing content", () => {
    const broken = {
      ...rooms,
      lab: { ...rooms.lab, furniture: [{ item: "machine" as const, x: 3, y: 2, project: "nope" }] },
    };
    expect(() => buildWorld(town, broken)).toThrow(/unknown project "nope"/);
  });
});
