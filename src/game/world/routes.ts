/**
 * Whether the visitor has just walked a secret route: the latest tiles they stepped onto are the
 * route's own, one after another, in either direction.
 */
export function walkedRoute(recent: readonly number[], route: readonly number[]): boolean {
  if (route.length === 0 || recent.length < route.length) return false;
  const walked = recent.slice(-route.length);
  return (
    walked.every((tile, i) => tile === route[i]) ||
    walked.every((tile, i) => tile === route[route.length - 1 - i])
  );
}
