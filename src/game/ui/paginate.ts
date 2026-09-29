/** Where a block sits in the list of blocks, measured in one long column: its top and its height. */
export interface Measured {
  top: number;
  height: number;
}

/**
 * Splits blocks (stacked in a column) into pages that each fit in `available` pixels, breaking only
 * between blocks. Returns the index of the first block of each page. A block too tall for a page on
 * its own gets a page to itself. With no room to measure (nothing has a height), everything is one page.
 */
export function pageStarts(blocks: readonly Measured[], available: number): number[] {
  if (blocks.length === 0) return [0];
  if (available <= 0 || blocks.every((block) => block.height <= 0)) return [0];
  const starts = [0];
  let top = blocks[0].top;
  blocks.forEach((block, i) => {
    if (i === 0) return;
    const bottom = block.top + block.height;
    if (bottom - top > available) {
      starts.push(i);
      top = block.top;
    }
  });
  return starts;
}

/** The blocks' indexes on each page. */
export function pagesOf(count: number, starts: readonly number[]): number[][] {
  return starts.map((start, page) => {
    const end = starts[page + 1] ?? count;
    return Array.from({ length: end - start }, (_, i) => start + i);
  });
}

/**
 * Cuts a long paragraph into pieces at the ends of sentences, each about `max` characters or fewer where the
 * sentences allow, so a page can break inside a paragraph without cutting a sentence in two.
 */
export function sentenceChunks(text: string, max = 110): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    const last = chunks.length - 1;
    if (last >= 0 && chunks[last].length + 1 + sentence.length <= max) {
      chunks[last] += ` ${sentence}`;
    } else {
      chunks.push(sentence);
    }
  }
  return chunks.length > 0 ? chunks : [text];
}

/** Splits a list into groups of at most `size`, in order. */
export function groups<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
