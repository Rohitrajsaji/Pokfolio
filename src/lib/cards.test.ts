import { site } from "@content";
import { describe, expect, it } from "vitest";
import {
  APPLE_ICON_SIZE,
  CARD_SIZE,
  FAVICON_SIZE,
  appleIconArt,
  faviconArt,
  iconArt,
  signText,
  socialCard,
} from "./cards";

describe("signText", () => {
  it("keeps only what the pixel font can draw", () => {
    expect(signText("Rohit Raj Saji")).toBe("ROHIT RAJ SAJI");
    expect(signText("Résumé, café!")).toBe("RESUME CAFE!");
    expect(signText("  many    spaces  ")).toBe("MANY SPACES");
    expect(signText("***")).toBe("");
  });

  it("gives the game's own title and subtitle back unchanged", () => {
    expect(signText(site.gameTitle)).toBe(site.gameTitle);
    expect(signText(site.gameSubtitle)).toBe(site.gameSubtitle);
  });
});

describe("icons", () => {
  it("draw the portrait on a rounded, framed 16×16 square", () => {
    const art = iconArt();
    expect([art.width, art.height]).toEqual([16, 16]);
    expect(art.get(0, 0)).toBeNull();
    expect(art.get(15, 15)).toBeNull();
    expect(art.get(8, 0)).toBe("#2a4f9b");
    expect(art.get(0, 8)).toBe("#2a4f9b");
    expect(art.get(1, 1)).toBe("#ffcb05");
  });

  it("show the professor's head, not just the background", () => {
    const art = iconArt();
    const colours = new Set<string | null>();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) colours.add(art.get(x, y));
    expect(colours.size).toBeGreaterThan(4);
  });

  it("come out at the sizes the routes promise, with no gaps in the home-screen icon", () => {
    const favicon = faviconArt();
    const apple = appleIconArt();
    expect([favicon.width, favicon.height]).toEqual([FAVICON_SIZE, FAVICON_SIZE]);
    expect([apple.width, apple.height]).toEqual([APPLE_ICON_SIZE, APPLE_ICON_SIZE]);
    for (const [x, y] of [
      [0, 0],
      [179, 0],
      [0, 179],
      [179, 179],
      [90, 90],
    ]) {
      expect(apple.get(x, y), `${x},${y}`).not.toBeNull();
    }
  });
});

describe("socialCard", () => {
  const card = socialCard();

  it("is the standard 1200×630 link-preview size", () => {
    expect([card.width, card.height]).toEqual([CARD_SIZE.width, CARD_SIZE.height]);
  });

  it("is fully painted, with a yellow rule at the top and bottom of the banner", () => {
    for (const [x, y] of [
      [0, 0],
      [1199, 629],
      [600, 315],
    ]) {
      expect(card.get(x, y), `${x},${y}`).not.toBeNull();
    }
    expect(card.get(600, 150)).toBe("#ffcb05");
    expect(card.get(600, 449)).toBe("#ffcb05");
  });

  it("puts the yellow title inside the banner", () => {
    let yellow = 0;
    for (let y = 156; y < 444; y++)
      for (let x = 0; x < 1200; x++) if (card.get(x, y) === "#ffcb05") yellow++;
    expect(yellow).toBeGreaterThan(2000);
  });

  it("draws the same picture every time", () => {
    expect(Buffer.compare(Buffer.from(socialCard().data), Buffer.from(card.data))).toBe(0);
  });
});
