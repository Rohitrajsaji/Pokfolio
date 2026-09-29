/** Time of day from the visitor's clock, and how the town is lit at each. */

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export const TIMES_OF_DAY: readonly TimeOfDay[] = ["morning", "day", "evening", "night"];

/** Morning 5–10, day 10–17, evening 17–20, night 20–5, in the visitor's local time. */
export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

/** A multiply tint over the town, and whether windows and lamps are on. */
export const LIGHTING: Readonly<Record<TimeOfDay, { tint: string | null; lit: boolean }>> = {
  morning: { tint: "#ffeedd", lit: false },
  day: { tint: null, lit: false },
  evening: { tint: "#ffb58a", lit: true },
  night: { tint: "#6a78c4", lit: true },
};

/** Reads a `?time=night`-style override, for testing and showing off. */
export function parseTimeOverride(value: string | null): TimeOfDay | null {
  return TIMES_OF_DAY.includes(value as TimeOfDay) ? (value as TimeOfDay) : null;
}
