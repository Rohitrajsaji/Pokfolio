import { describe, expect, it } from "vitest";
import appleIcon, { contentType as appleType, size as appleSize } from "./apple-icon";
import icon, { contentType as iconType, size as iconSize } from "./icon";
import ogImage, { alt, contentType as ogType, size as ogSize } from "./opengraph-image";

/** What a PNG response says about itself. */
async function inspect(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer);
  return {
    type: response.headers.get("content-type"),
    signature: Array.from(bytes.subarray(0, 8)),
    width: view.getUint32(16),
    height: view.getUint32(20),
    length: bytes.length,
  };
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

describe("generated images", () => {
  it.each([
    ["the favicon", icon, iconSize, iconType],
    ["the home-screen icon", appleIcon, appleSize, appleType],
    ["the social card", ogImage, ogSize, ogType],
  ])("%s is a PNG of exactly the size it announces", async (_name, route, size, type) => {
    const image = await inspect(route());
    expect(image.type).toBe(type);
    expect(image.signature).toEqual(PNG_SIGNATURE);
    expect([image.width, image.height]).toEqual([size.width, size.height]);
  });

  it("keeps the social card small enough for every network", async () => {
    // Twitter/X takes up to 5 MB; a pixel-art card should be a tiny fraction of that.
    expect((await inspect(ogImage())).length).toBeLessThan(600_000);
  });

  it("describes the social card for people who can't see it", () => {
    expect(alt).toMatch(/Rohit Raj Saji/);
    expect(alt.length).toBeGreaterThan(20);
  });
});
