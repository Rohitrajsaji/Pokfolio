import type { YearMonth } from "@content/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

function parse(value: YearMonth): { year: number; month: string } {
  const match = YEAR_MONTH.exec(value);
  if (!match) throw new Error(`Expected a date like "2026-03", got "${value}"`);
  return { year: Number(match[1]), month: MONTHS[Number(match[2]) - 1] };
}

/** "2026-03" → "Mar 2026" */
export function formatYearMonth(value: YearMonth): string {
  const { year, month } = parse(value);
  return `${month} ${year}`;
}

/** "2025-07", "2025-12" → "Jul – Dec 2025"; "2026-03", "present" → "Mar 2026 – Present" */
export function formatRange(start: YearMonth, end: YearMonth | "present"): string {
  if (end === "present") return `${formatYearMonth(start)} – Present`;
  if (start === end) return formatYearMonth(start);
  const from = parse(start);
  const to = parse(end);
  if (from.year === to.year) return `${from.month} – ${to.month} ${to.year}`;
  return `${formatYearMonth(start)} – ${formatYearMonth(end)}`;
}
