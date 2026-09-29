/**
 * Where the camera sits, always in whole game pixels.
 *
 * The world is drawn at `-camera` and shown with nearest-neighbour sampling. A half-pixel
 * offset (which centring on an odd-sized view gives) makes the browser drop some columns and
 * rows of pixels and double others, so thin strokes such as the letters on the building signs
 * vanish. Rounding here keeps every draw on the pixel grid.
 */
export function cameraAxis(centre: number, mapSize: number, viewSize: number): number {
  // A map smaller than the view sits in the middle of it.
  if (mapSize <= viewSize) return -Math.floor((viewSize - mapSize) / 2);
  const wanted = Math.round(centre - viewSize / 2);
  return Math.max(0, Math.min(mapSize - viewSize, wanted));
}

export function cameraFor(
  centre: { x: number; y: number },
  map: { width: number; height: number },
  view: { width: number; height: number },
): { x: number; y: number } {
  return {
    x: cameraAxis(centre.x, map.width, view.width),
    y: cameraAxis(centre.y, map.height, view.height),
  };
}
