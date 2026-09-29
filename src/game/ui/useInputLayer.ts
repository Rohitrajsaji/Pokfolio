import { useEffect, useRef } from "react";
import { input, type Action } from "../engine/input";

/**
 * While the calling component is mounted, game buttons go to `handler`
 * instead of the town (or whatever is underneath).
 */
export function useInputLayer(handler: (action: Action) => void): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => input.pushLayer((action) => latest.current(action)), []);
}
