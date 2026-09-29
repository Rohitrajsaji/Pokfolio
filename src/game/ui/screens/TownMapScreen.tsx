"use client";

import { site, town } from "@content";
import { useEffect, useRef, useState } from "react";
import { BUILDINGS } from "@/art/buildings";
import { paintBuffer } from "@/art/canvas";
import { shrinkBuffer } from "@/art/scale";
import { TILE } from "@/art/terrain";
import { useGame } from "../../state/store";
import { fill } from "../../text";
import { townPicture } from "../../world/picture";
import type { MapId, Spot } from "../../world/runtime";
import { ScreenFrame } from "../ScreenFrame";

interface Destination {
  id: string;
  label: string;
  note: string;
  /** Tile the marker sits on. */
  x: number;
  y: number;
  to: MapId;
  spot?: Spot;
}

/** Every building (straight inside), plus the tall grass where the wild ROHIT hides. */
function destinations(): Destination[] {
  const places: Destination[] = town.buildings.map((b) => {
    const def = BUILDINGS[b.building];
    const [label, note = ""] = fill(b.hint).split(" · ");
    return {
      id: b.building,
      label,
      note,
      x: b.x + def.door.x,
      y: b.y + def.door.y,
      to: b.building,
    };
  });
  const rows = town.ground;
  for (let y = 1; y < rows.length && places.length === town.buildings.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === '"' && rows[y - 1][x] === "=") {
        places.push({
          id: "grass",
          label: "TALL GRASS",
          note: fill("Where the wild {wild} hides"),
          x,
          y,
          to: "town",
          spot: { x, y: y - 1, facing: "down" },
        });
        break;
      }
    }
  }
  return places;
}

/** The map is the town shrunk 4×, then shown at 2 game pixels per map pixel: 8 game pixels a tile. */
const MAP_SHRINK = 4;
const TILE_GAME_PX = 8;
/** The middle of a tile, in game pixels from the map's corner. */
const at = (tile: number) => `calc(${tile * TILE_GAME_PX + TILE_GAME_PX / 2} * var(--px))`;

export function TownMapScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [places] = useState(destinations);
  const [active, setActive] = useState<string | null>(places[0]?.id ?? null);
  const mapId = useGame((state) => state.mapId);
  const position = useGame((state) => state.position);
  const width = town.ground[0].length;
  const height = town.ground.length;

  useEffect(() => {
    if (canvasRef.current) paintBuffer(canvasRef.current, shrinkBuffer(townPicture(), MAP_SHRINK));
  }, []);

  const go = (place: Destination) => {
    const game = useGame.getState();
    game.closeAll();
    game.travel?.(place.to, place.spot);
  };

  const here = mapId === "town" ? position : places.find((p) => p.to === mapId);

  return (
    <ScreenFrame title="TOWN MAP" accent="#3f8f5a">
      <div className="town-map">
        <div className="town-map-view">
          <canvas
            ref={canvasRef}
            width={(width * TILE) / MAP_SHRINK}
            height={(height * TILE) / MAP_SHRINK}
            className="town-map-canvas"
            role="img"
            aria-label={`Map of ${site.townName}`}
          />
          {places.map((place) => (
            <span
              key={place.id}
              className="map-marker"
              data-active={active === place.id}
              style={{ left: at(place.x), top: at(place.y) }}
              aria-hidden
            />
          ))}
          {here && (
            <span className="map-you" style={{ left: at(here.x), top: at(here.y) }}>
              YOU
            </span>
          )}
        </div>
        <ul className="map-list" aria-label="Places">
          {places.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                data-nav
                className="map-item"
                onFocus={() => setActive(place.id)}
                onMouseEnter={() => setActive(place.id)}
                onClick={() => go(place)}
              >
                {place.label}
                <span className="map-item-note">{place.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="screen-hint">Pick a place to go straight there.</p>
    </ScreenFrame>
  );
}
