"use client";

import { site, town } from "@content";
import { useEffect, useRef, useState } from "react";
import { BUILDINGS } from "@/art/buildings";
import { paintBuffer } from "@/art/canvas";
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

const percent = (tile: number, of: number) => `${((tile + 0.5) / of) * 100}%`;

export function TownMapScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [places] = useState(destinations);
  const [active, setActive] = useState<string | null>(places[0]?.id ?? null);
  const mapId = useGame((state) => state.mapId);
  const position = useGame((state) => state.position);
  const width = town.ground[0].length;
  const height = town.ground.length;

  useEffect(() => {
    if (canvasRef.current) paintBuffer(canvasRef.current, townPicture());
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
            width={width * TILE}
            height={height * TILE}
            className="town-map-canvas"
            role="img"
            aria-label={`Map of ${site.townName}`}
          />
          {places.map((place) => (
            <span
              key={place.id}
              className="map-marker"
              data-active={active === place.id}
              style={{ left: percent(place.x, width), top: percent(place.y, height) }}
              aria-hidden
            />
          ))}
          {here && (
            <span
              className="map-you"
              style={{ left: percent(here.x, width), top: percent(here.y, height) }}
            >
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
