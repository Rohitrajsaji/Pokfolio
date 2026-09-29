// Captures the game's own synthesized music as it plays on the title, in town and in battle.
// Usage: node music.mjs  ->  clips/music.webm plus clips/music.json (seconds where each track begins)
import fs from "fs";
import path from "path";
import { launch, scene, openTitle, travelTo, wait, CLIPS } from "./lib.mjs";
import { findBattle } from "./battle.mjs";

const browser = await launch();
const { page, finish } = await scene(browser, null);

await page.addInitScript(() => {
  const chunks = [];
  window.__chunks = chunks;
  const nativeConnect = AudioNode.prototype.connect;
  let tap = null;
  AudioNode.prototype.connect = function (target, ...rest) {
    if (target instanceof AudioDestinationNode) {
      if (!tap) {
        tap = target.context.createMediaStreamDestination();
        window.__tap = tap;
      }
      nativeConnect.call(this, tap, ...rest);
    }
    return nativeConnect.call(this, target, ...rest);
  };
  window.__startRecording = () => {
    const recorder = new MediaRecorder(window.__tap.stream, { mimeType: "audio/webm;codecs=opus" });
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.start(250);
    window.__recorder = recorder;
    window.__t0 = performance.now();
  };
  window.__now = () => (performance.now() - window.__t0) / 1000;
});

await openTitle(page);
await page.getByRole("button", { name: /SOUND/ }).first().click();
await wait(page, 600);
await page.evaluate(() => window.__startRecording());
const marks = {};
const mark = async (name) => {
  marks[name] = await page.evaluate(() => window.__now());
};

await mark("title");
await wait(page, 9000);
await page.getByRole("menuitem", { name: "PRESS START" }).click();
await page.locator(".intro-scene").waitFor();
await page.keyboard.press("Escape");
await page.locator(".intro-scene").waitFor({ state: "hidden" });
await wait(page, 1200);
for (let i = 0; i < 12 && (await page.getByRole("group", { name: "Dialog" }).isVisible().catch(() => false)); i++) {
  await page.keyboard.press("Enter");
  await wait(page, 250);
}
await mark("town");
await wait(page, 9000);
await travelTo(page, /TALL GRASS/);
await findBattle(page);
await wait(page, 1200);
await mark("battle");
await wait(page, 10000);
await mark("end");

const base64 = await page.evaluate(
  () =>
    new Promise((resolve) => {
      window.__recorder.onstop = async () => {
        const blob = new Blob(window.__chunks, { type: "audio/webm" });
        const buffer = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (let i = 0; i < buffer.length; i += 0x8000) {
          binary += String.fromCharCode(...buffer.subarray(i, i + 0x8000));
        }
        resolve(btoa(binary));
      };
      window.__recorder.stop();
    }),
);
fs.writeFileSync(path.join(CLIPS, "music.webm"), Buffer.from(base64, "base64"));
fs.writeFileSync(path.join(CLIPS, "music.json"), JSON.stringify(marks, null, 1));
console.log("music", marks);
await finish();
await browser.close();
