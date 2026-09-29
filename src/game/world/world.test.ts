import { projects, rooms, secretRooms, town } from "@content";
import type { RoomId, SecretRoomId } from "@content/types";
import { describe, expect, it } from "vitest";
import { PixelBuffer } from "@/art/pixel-buffer";
import { TILE } from "@/art/terrain";
import { findPath } from "../engine/path";
import { applySecrets, buildWorld, roomExits } from "./compile";
import { walkedRoute } from "./routes";
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

  it("has no way off the map on foot, because SNORLAX sleeps across the road out", () => {
    expect(map.edges.size).toBe(0);
    const lastRow = town.ground.length - 1;
    const road = [...town.ground[lastRow]].flatMap((ch, x) => (ch === "=" ? [x] : []));
    expect(road.length).toBeGreaterThan(0);
    for (const x of road) expect(isSolid(map, x, lastRow), `road tile ${x}`).toBe(true);
  });

  it("maps every building tile to its door, for tap-to-walk", () => {
    for (const [tile, door] of map.doors) expect(map.warps.has(door), `tile ${tile}`).toBe(true);
  });
});

describe("the pond, the sleeping SNORLAX and the shore between them", () => {
  const map = world.town;
  const reach = reachable(map);
  const snorlax = town.props.find((prop) => prop.prop === "snorlax")!;
  const snorlaxTiles = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ].map(([dx, dy]) => tileIndex(map, snorlax.x + dx, snorlax.y + dy));
  const shore = map.routes!.find((route) => route.id === "shore")!;

  it("has water you can't walk on, and none of it is tall grass", () => {
    const water = map.water ?? [];
    expect(water.length).toBeGreaterThan(0);
    for (const { x, y } of water) {
      const index = tileIndex(map, x, y);
      expect(isSolid(map, x, y), `water at ${x},${y}`).toBe(true);
      expect(map.grass[index], `water at ${x},${y}`).toBe(0);
      expect(reach.has(index), `water at ${x},${y}`).toBe(false);
    }
  });

  it("has SNORLAX taking up four tiles, all one thing, so coming back counts once", () => {
    expect(new Set(snorlaxTiles).size).toBe(4);
    const reads = new Set(snorlaxTiles.map((tile) => map.reads.get(tile)));
    expect(reads.size).toBe(1);
    expect(reads.has(undefined)).toBe(false);
    for (const tile of snorlaxTiles) expect(map.solid[tile], `tile ${tile}`).toBe(1);
  });

  it("lets the visitor walk up to SNORLAX from the start", () => {
    const usableTile = snorlaxTiles.some((tile) =>
      usable(map, reach, tile % map.width, Math.floor(tile / map.width)),
    );
    expect(usableTile).toBe(true);
  });

  it("has a shore route that runs beside the water and can be walked from the road", () => {
    expect(shore.effect.cameo).toBe("missingno");
    for (const tile of shore.tiles) expect(reach.has(tile), `tile ${tile}`).toBe(true);
    const water = new Set((map.water ?? []).map(({ x, y }) => tileIndex(map, x, y)));
    const beside = shore.tiles.filter((tile) => water.has(tile + map.width));
    expect(beside.length).toBeGreaterThanOrEqual(4);
  });

  it("is never walked by accident on the way to a door or a sign", () => {
    const grid = {
      width: map.width,
      height: map.height,
      passable: (x: number, y: number) => !isSolid(map, x, y),
    };
    const goals = [...map.warps.keys()].map((tile) => ({
      x: tile % map.width,
      y: Math.floor(tile / map.width),
    }));
    expect(goals.length).toBeGreaterThan(0);
    for (const goal of goals) {
      const steps = findPath(grid, map.start, goal)!;
      expect(steps, `a way to ${goal.x},${goal.y}`).not.toBeNull();
      const walked: number[] = [];
      let { x, y } = map.start;
      for (const dir of steps) {
        x += STEP[dir].dx;
        y += STEP[dir].dy;
        walked.push(tileIndex(map, x, y));
        expect(walkedRoute(walked, shore.tiles), `on the way to ${goal.x},${goal.y}`).toBe(false);
      }
    }
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

describe("the hidden staircase in the Lab", () => {
  const stairs = rooms.lab.stairs!;
  const stairsTile = (map: RuntimeMap) => tileIndex(map, stairs.x, 1);

  it("is plain wall until its secret is found, with a poster on it that reveals the secret", () => {
    const closed = buildWorld().lab;
    expect(closed.stairsOpen).toBe(false);
    expect(closed.solid[stairsTile(closed)]).toBe(1);
    expect(closed.warps.has(stairsTile(closed))).toBe(false);
    expect(closed.reads.get(stairsTile(closed))?.effect).toEqual({ unlock: stairs.secret });
  });

  it("is a doorway to the Game Corner once found, and the poster that hid it is gone", () => {
    const open = buildWorld(town, rooms, secretRooms, [stairs.secret]).lab;
    expect(open.stairsOpen).toBe(true);
    expect(open.solid[stairsTile(open)]).toBe(0);
    expect(open.reads.has(stairsTile(open))).toBe(false);
    const warp = open.warps.get(stairsTile(open));
    expect(warp?.to).toBe(stairs.to);
    const arcade = world[stairs.to];
    expect([warp!.x, warp!.y]).toEqual([arcade.start.x, arcade.start.y]);
  });

  it("can be walked up to from the floor once it's open, and not before", () => {
    const closed = buildWorld().lab;
    const open = buildWorld(town, rooms, secretRooms, [stairs.secret]).lab;
    expect(reachable(closed).has(stairsTile(closed))).toBe(false);
    expect(reachable(open).has(stairsTile(open))).toBe(true);
  });

  it("is opened in place by applySecrets, which says which rooms it changed", () => {
    const fresh = buildWorld();
    const before = fresh.lab;
    expect(applySecrets(fresh, [])).toEqual([]);
    expect(fresh.lab).toBe(before);
    expect(applySecrets(fresh, [stairs.secret])).toEqual(["lab"]);
    expect(fresh.lab.stairsOpen).toBe(true);
    expect(fresh.lab).not.toBe(before);
    // Nothing more to do the second time.
    expect(applySecrets(fresh, [stairs.secret])).toEqual([]);
  });

  it("gives the same room and people as before, so nobody is moved", () => {
    const fresh = buildWorld();
    const npcs = fresh.lab.npcs;
    applySecrets(fresh, [stairs.secret]);
    expect(fresh.lab.npcs).toBe(npcs);
  });
});

describe.each(Object.keys(secretRooms) as SecretRoomId[])("the %s", (id) => {
  const map = world[id];
  const spec = secretRooms[id];
  const reach = reachable(map);

  it("starts you on open floor and can be left", () => {
    expect(isSolid(map, map.start.x, map.start.y)).toBe(false);
    const exits = roomExits(spec).map((x) => tileIndex(map, x, spec.height - 1));
    expect(exits.some((exit) => reach.has(exit))).toBe(true);
  });

  it("leads back up to the tile in front of the staircase that leads down to it", () => {
    const host = spec.leadsTo!;
    const stairs = rooms[host].stairs!;
    expect(stairs.to).toBe(id);
    for (const x of roomExits(spec)) {
      const warp = map.warps.get(tileIndex(map, x, spec.height - 1));
      expect(warp).toMatchObject({ to: host, x: stairs.x, y: 2 });
      expect(isSolid(world[host], warp!.x, warp!.y)).toBe(false);
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

  it("is refused when its staircase doesn't lead back to it", () => {
    const orphan = { ...secretRooms, [id]: { ...spec, leadsTo: undefined } };
    expect(() => buildWorld(town, rooms, orphan)).toThrow(/must lead to a room/);
  });
});

describe("secret routes", () => {
  const withRoutes = (routes: NonNullable<typeof town.routes>) => ({ ...town, routes });
  const effect = { cameo: "missingno" as const };

  it("are compiled to tile numbers, in the order they're walked", () => {
    const start = { x: town.start.x, y: town.start.y };
    const route = [start, { x: start.x, y: start.y - 1 }];
    const map = buildWorld(withRoutes([{ id: "r", tiles: route, effect }])).town;
    expect(map.routes).toEqual([
      {
        id: "r",
        tiles: [tileIndex(map, start.x, start.y), tileIndex(map, start.x, start.y - 1)],
        effect,
      },
    ]);
  });

  it("must stay on ground you can walk on", () => {
    expect(() => buildWorld(withRoutes([{ id: "wall", tiles: [{ x: 0, y: 0 }], effect }]))).toThrow(
      /can't be walked on/,
    );
  });

  it("must go one step at a time", () => {
    const { x, y } = town.start;
    expect(() =>
      buildWorld(
        withRoutes([
          {
            id: "leap",
            tiles: [
              { x, y },
              { x, y: y - 3 },
            ],
            effect,
          },
        ]),
      ),
    ).toThrow(/jumps from/);
  });
});

describe("coming back to things", () => {
  const everything = Object.values(world).flatMap((map) => [
    ...map.reads.values(),
    ...map.npcs.map((npc) => npc.talk),
  ]);

  it("gives each thing its later versions in order, starting from the second visit", () => {
    const withVisits = everything.filter((thing) => thing.visits);
    // The elder, the fossil, the TV and SNORLAX have something more to say.
    expect(withVisits.length).toBeGreaterThanOrEqual(4);
    for (const thing of withVisits) {
      const from = thing.visits!.map((visit) => visit.from);
      expect(
        from.every((n) => Number.isInteger(n) && n >= 2),
        JSON.stringify(from),
      ).toBe(true);
      expect(new Set(from).size, JSON.stringify(from)).toBe(from.length);
      expect(
        [...from].sort((a, b) => a - b),
        JSON.stringify(from),
      ).toEqual(from);
    }
  });

  it("lets every later version say something, or do something", () => {
    for (const thing of everything.filter((t) => t.visits)) {
      for (const visit of thing.visits!) {
        const doesSomething = Boolean(visit.lines?.length || visit.effect || visit.then);
        expect(doesSomething, `visit ${visit.from}`).toBe(true);
      }
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

describe("the border beyond a map's edge", () => {
  it("is a tile of trees outdoors, painted on solid ground with no gaps", () => {
    const border = world.town.border;
    expect(border).toBeDefined();
    const buf = new PixelBuffer(border!.size, border!.size);
    border!.paint(buf);
    const colours = new Set<number>();
    for (let i = 0; i < buf.data.length; i += 4) {
      expect(buf.data[i + 3], "every pixel is opaque").toBe(255);
      colours.add((buf.data[i] << 16) | (buf.data[i + 1] << 8) | buf.data[i + 2]);
    }
    expect(colours.size).toBeGreaterThan(6);
  });

  it("is a whole number of trees, so it repeats in step with the town's own trees", () => {
    expect(world.town.border!.size % (2 * TILE)).toBe(0);
  });

  it("leaves the inside of buildings black", () => {
    for (const id of Object.keys(rooms) as RoomId[]) expect(world[id].border).toBeUndefined();
  });
});
