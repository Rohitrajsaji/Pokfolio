"use client";

import { site, town } from "@content";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BUILDINGS } from "@/art/buildings";
import { paintBuffer } from "@/art/canvas";
import { shrinkBuffer } from "@/art/scale";
import { TILE } from "@/art/terrain";
import { useGame } from "../../state/store";
import { fill } from "../../text";
import { townPicture } from "../../world/picture";
import type { MapId, Spot } from "../../world/runtime";
import { Paged } from "../Paged";
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

/**
 * The map is the town shrunk by a whole number, then shown at a whole number of game pixels per map
 * pixel. A roomy view shrinks 4× and shows it at 2× (8 game pixels a tile, 192 wide); a 320-wide one
 * shrinks 3× and shows it at 1× (128 wide), leaving the list room for whole names.
 */
const ROOMY_FROM = 400;
export function mapSizing(viewWidth: number): { shrink: number; show: number } {
  return viewWidth >= ROOMY_FROM ? { shrink: 4, show: 2 } : { shrink: 3, show: 1 };
}

export function TownMapScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [places] = useState(destinations);
  const [active, setActive] = useState<string | null>(places[0]?.id ?? null);
  const mapId = useGame((state) => state.mapId);
  const position = useGame((state) => state.position);
  const viewWidth = useGame((state) => state.view?.width ?? 320);
  const { shrink, show } = mapSizing(viewWidth);
  const width = town.ground[0].length;
  const height = town.ground.length;
  const tileGamePx = (TILE / shrink) * show;
  /** The middle of a tile, in whole game pixels from the map's corner. */
  const at = (tile: number) =>
    `round(calc(${(tile + 0.5) * tileGamePx} * var(--px)), calc(1 * var(--px)))`;

  useEffect(() => {
    if (canvasRef.current) {
      paintBuffer(canvasRef.current, shrinkBuffer(townPicture(), shrink, "common"));
    }
  }, [shrink]);

  const go = (place: Destination) => {
    const game = useGame.getState();
    game.closeAll();
    game.travel?.(place.to, place.spot);
  };

  const here = mapId === "town" ? position : places.find((p) => p.to === mapId);

  return (
    <ScreenFrame title="TOWN MAP" accent="#3f8f5a" fit>
      <div className="town-map town-map-fit">
        <div
          className="town-map-view"
          style={
            {
              "--map-w": ((width * TILE) / shrink) * show,
              "--map-h": ((height * TILE) / shrink) * show,
            } as CSSProperties
          }
        >
          <canvas
            key={shrink}
            ref={canvasRef}
            width={Math.floor((width * TILE) / shrink)}
            height={Math.floor((height * TILE) / shrink)}
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
        <Paged
          label="Places pages"
          blocks={places.map((place) => (
            <button
              key={place.id}
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
          ))}
        />
      </div>
    </ScreenFrame>
  );
}
