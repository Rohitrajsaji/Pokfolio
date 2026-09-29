/**
 * Matches a visitor's free-text question to one of the professor's topics
 * by keyword. Words are lower-cased and lightly stemmed, so "relocating",
 * "relocation" and "relocate" all match.
 */
import type { QaSpec } from "@content/types";

export type Topic = QaSpec["topics"][number];

function stem(word: string): string {
  return word.length > 4 ? word.replace(/(ations?|ings?|ions?|ers?|ed|es|s|e)$/, "") : word;
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(stem);
}

/** The best-matching topic, or null when nothing matches. Ties go to the earlier topic. */
export function matchQuestion(qa: QaSpec, question: string): Topic | null {
  const asked = words(question);
  if (asked.length === 0) return null;
  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of qa.topics) {
    let score = 0;
    for (const keyword of topic.keywords.flatMap(words)) {
      if (asked.includes(keyword)) {
        score += 2;
      } else if (
        keyword.length >= 4 &&
        asked.some((w) => w.length >= 4 && (w.startsWith(keyword) || keyword.startsWith(w)))
      ) {
        score += 1;
      }
    }
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return best;
}
