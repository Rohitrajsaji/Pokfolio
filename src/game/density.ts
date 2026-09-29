/**
 * Calls `onChange` whenever the screen density (devicePixelRatio) changes: browser zoom,
 * or dragging the window to a monitor with a different density. Neither reliably resizes
 * the page, so the view has to be told.
 */
export function watchDensity(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  let query: MediaQueryList | null = null;
  const listen = () => {
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    query.addEventListener("change", changed);
  };
  const changed = () => {
    query?.removeEventListener("change", changed);
    onChange();
    listen();
  };
  listen();
  return () => query?.removeEventListener("change", changed);
}
