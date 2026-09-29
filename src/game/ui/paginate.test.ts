import { describe, expect, it } from "vitest";
import { pageStarts, pagesOf, type Measured } from "./paginate";

/** Blocks of the given heights, stacked with `gap` between them. */
function stack(heights: number[], gap = 4): Measured[] {
  let top = 0;
  return heights.map((height) => {
    const block = { top, height };
    top += height + gap;
    return block;
  });
}

describe("pageStarts", () => {
  it("puts everything on one page when it fits", () => {
    expect(pageStarts(stack([20, 20, 20]), 100)).toEqual([0]);
  });

  it("counts the gaps between blocks, not only the blocks", () => {
    // 20 + 4 + 20 + 4 + 20 = 68 fits in 68, but not in 67.
    expect(pageStarts(stack([20, 20, 20]), 68)).toEqual([0]);
    expect(pageStarts(stack([20, 20, 20]), 67)).toEqual([0, 2]);
  });

  it("starts a new page at the first block that won't fit, and measures from there", () => {
    expect(pageStarts(stack([30, 30, 30, 30, 30]), 70)).toEqual([0, 2, 4]);
  });

  it("gives a block taller than a page a page of its own, without looping", () => {
    expect(pageStarts(stack([10, 200, 10]), 50)).toEqual([0, 1, 2]);
    expect(pageStarts(stack([200]), 50)).toEqual([0]);
  });

  it("keeps everything together when there is no room to measure", () => {
    expect(pageStarts(stack([20, 20]), 0)).toEqual([0]);
    expect(pageStarts(stack([0, 0]), 100)).toEqual([0]);
    expect(pageStarts([], 100)).toEqual([0]);
  });

  it("never splits a block in two: every block is on exactly one page", () => {
    const blocks = stack([12, 40, 18, 25, 9, 31, 22]);
    const pages = pagesOf(blocks.length, pageStarts(blocks, 60));
    expect(pages.flat()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const page of pages) {
      const first = blocks[page[0]];
      const last = blocks[page[page.length - 1]];
      // A page fits unless it's one block that is too tall on its own.
      expect(page.length === 1 || last.top + last.height - first.top <= 60).toBe(true);
    }
  });
});

describe("pagesOf", () => {
  it("lists the blocks on each page", () => {
    expect(pagesOf(5, [0, 2, 4])).toEqual([[0, 1], [2, 3], [4]]);
    expect(pagesOf(3, [0])).toEqual([[0, 1, 2]]);
  });
});
