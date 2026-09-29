import { crc32, inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { encodePng } from "./png";
import { PixelBuffer } from "./pixel-buffer";

interface Chunk {
  type: string;
  data: Uint8Array;
  crc: number;
}

/** Reads a PNG's chunks back out, the slow honest way. */
function chunksOf(png: Uint8Array): Chunk[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const found: Chunk[] = [];
  for (let at = 8; at < png.length;) {
    const length = view.getUint32(at);
    found.push({
      type: String.fromCharCode(...png.subarray(at + 4, at + 8)),
      data: png.subarray(at + 8, at + 8 + length),
      crc: view.getUint32(at + 8 + length),
    });
    at += 12 + length;
  }
  return found;
}

function sample(): PixelBuffer {
  const buf = new PixelBuffer(3, 2);
  buf.set(0, 0, "#ff0000");
  buf.set(1, 0, "#00ff00");
  buf.set(2, 0, "#0000ff");
  buf.set(0, 1, "#123456");
  buf.set(2, 1, "#fedcba");
  // (1, 1) stays transparent
  return buf;
}

describe("encodePng", () => {
  const png = encodePng(sample());
  const chunks = chunksOf(png);

  it("starts with the PNG signature and ends with IEND", () => {
    expect(Array.from(png.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(chunks.map((c) => c.type)).toEqual(["IHDR", "IDAT", "IEND"]);
  });

  it("describes an 8-bit RGBA image of the right size", () => {
    const header = new DataView(chunks[0].data.buffer, chunks[0].data.byteOffset, 13);
    expect(header.getUint32(0)).toBe(3);
    expect(header.getUint32(4)).toBe(2);
    expect(header.getUint8(8)).toBe(8);
    expect(header.getUint8(9)).toBe(6);
  });

  it("checksums every chunk correctly", () => {
    for (const { type, data, crc } of chunks) {
      expect(crc, type).toBe(crc32(Buffer.concat([Buffer.from(type), data])));
    }
  });

  it("stores the pixels unchanged, one filter byte per row", () => {
    const raw = inflateSync(chunks[1].data);
    const original = sample().data;
    expect(raw.length).toBe(2 * (1 + 3 * 4));
    for (let row = 0; row < 2; row++) {
      expect(raw[row * 13], `row ${row} filter`).toBe(0);
      expect(Array.from(raw.subarray(row * 13 + 1, row * 13 + 13))).toEqual(
        Array.from(original.subarray(row * 12, row * 12 + 12)),
      );
    }
  });

  it("keeps transparent pixels transparent", () => {
    const raw = inflateSync(chunks[1].data);
    // Row 1, pixel 1: its alpha byte
    expect(raw[13 + 1 + 1 * 4 + 3]).toBe(0);
  });
});
