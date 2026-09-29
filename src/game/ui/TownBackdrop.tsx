"use client";

import { town } from "@content";
import { useEffect, useRef } from "react";
import { paintBuffer } from "@/art/canvas";
import { TILE } from "@/art/terrain";
import { townPicture } from "../world/picture";

/** The whole town by day, as a picture behind the title screen and the intro. */
export function TownBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintBuffer(ref.current, townPicture());
  }, []);
  return (
    <canvas
      ref={ref}
      width={town.ground[0].length * TILE}
      height={town.ground.length * TILE}
      className="town-backdrop"
      aria-hidden
    />
  );
}
