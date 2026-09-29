import { profile } from "@content";
import { describe, expect, it } from "vitest";
import { GET, generateStaticParams } from "./app-icon/[size]/route";
import manifest from "./manifest";

const iconSize = async (response: Response) => {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer);
  return [view.getUint32(16), view.getUint32(20)];
};

describe("the app manifest", () => {
  const app = manifest();

  it("opens full-screen, on a black background, at the game", () => {
    expect(app).toMatchObject({
      display: "fullscreen",
      start_url: "/",
      background_color: "#000000",
      short_name: profile.shortName,
    });
  });

  it("offers icons big enough for an app, and the app-icon route makes every one it lists", async () => {
    const own = (app.icons ?? []).filter((icon) => icon.src.startsWith("/app-icon/"));
    expect(own.length).toBeGreaterThanOrEqual(2);
    for (const icon of own) {
      const size = icon.src.split("/").pop() ?? "";
      const response = await GET(new Request("http://localhost/"), {
        params: Promise.resolve({ size }),
      });
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(await iconSize(response)).toEqual(Number(size) ? [Number(size), Number(size)] : []);
      expect(icon.sizes).toBe(`${size}x${size}`);
    }
    expect(generateStaticParams().map((p) => p.size)).toEqual(
      own.map((i) => i.src.split("/").pop()),
    );
  });

  it("says no to sizes it doesn't make", async () => {
    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ size: "999" }),
    });
    expect(response.status).toBe(404);
  });
});
