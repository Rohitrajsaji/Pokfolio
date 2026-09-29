// Usage: node record.mjs <pro|social> [scene ...]
import fs from "fs";
import path from "path";
import { launch, scene, startGame, openTitle, travelTo, hold, wait, caption, closeDialogs, CLIPS } from "./lib.mjs";
import { findBattle, line } from "./battle.mjs";

const variant = process.argv[2] ?? "pro";
const only = process.argv.slice(3);
const TEXT = {
  pro: {
    title: "A portfolio you can play",
    town: "Every building is a chapter",
    town2: "Projects · Experience · Skills · Contact",
    battle: "Catch the wild ROHIT to hire them",
    glitch: "Secrets hide all over town",
    shiny: "Find them all",
  },
  social: {
    title: "POV: your portfolio is a Pokémon game",
    town: "walk in. everything's a level",
    town2: "",
    battle: "a wild ROHIT appeared!!",
    glitch: "wait... what was THAT?",
    shiny: "...is that a SHINY?!",
  },
}[variant];

const browser = await launch();
const metaFile = path.join(CLIPS, `${variant}.json`);
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
const run = (name) => only.length === 0 || only.includes(name);

/** Records one scene; `body` gets helpers to mark the part of the video worth keeping. */
async function record(name, body) {
  if (!run(name)) return;
  const label = `${variant}-${name}`;
  const s = await scene(browser, label);
  const t0 = Date.now();
  const segs = [];
  let open = null;
  const api = {
    page: s.page,
    begin: () => { open = (Date.now() - t0) / 1000; },
    end: (tag = name) => { segs.push({ tag, start: open, end: (Date.now() - t0) / 1000 }); open = null; },
  };
  try {
    await body(api);
  } finally {
    await s.finish();
  }
  meta[label] = segs;
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
  console.log(label, JSON.stringify(segs));
}

await record("title", async ({ page, begin, end }) => {
  await openTitle(page);
  begin();
  await caption(page, TEXT.title);
  await wait(page, 3400);
  await page.keyboard.press("Enter");
  await wait(page, 2200);
  end();
});

await record("town", async ({ page, begin, end }) => {
  await startGame(page);
  begin();
  await caption(page, TEXT.town);
  await hold(page, "ArrowUp", 1200);
  await hold(page, "ArrowRight", 300);
  await hold(page, "ArrowUp", 900);
  await hold(page, "ArrowUp", 700);
  await hold(page, "ArrowLeft", 900);
  await wait(page, 300);
  await hold(page, "ArrowUp", 120);
  await wait(page, 1100);
  if (TEXT.town2) await caption(page, TEXT.town2);
  await hold(page, "ArrowUp", 500);
  await wait(page, 2200);
  end();
});

await record("battle", async ({ page, begin, end }) => {
  await startGame(page);
  await travelTo(page, /TALL GRASS/);
  await caption(page, TEXT.battle, 230);
  begin();
  await findBattle(page);
  await wait(page, 2300);
  const readAll = async () => {
    for (let i = 0; i < 12 && (await line(page)) !== null; i++) {
      await page.keyboard.press("Enter");
      await wait(page, 480);
    }
  };
  await readAll();
  const menu = () =>
    page.locator(".battle").getByText("What will").first().isVisible().catch(() => false);
  const pick = (text) =>
    page
      .locator(".battle")
      .getByText(text, typeof text === "string" ? { exact: true } : undefined)
      .first()
      .click();
  await pick("FIGHT");
  await wait(page, 500);
  await pick(/THUNDERBOLT/);
  await wait(page, 600);
  await readAll();
  // The second ball always catches.
  for (let i = 0; i < 2 && (await menu()); i++) {
    await pick("BAG");
    await wait(page, 500);
    await pick(/^POKé BALL/);
    await wait(page, 4200);
    await readAll();
  }
  await wait(page, 2200);
  end();
});

await record("shiny", async ({ page, begin, end }) => {
  await startGame(page);
  await travelTo(page, /TALL GRASS/);
  await caption(page, TEXT.glitch);
  begin();
  await page.keyboard.down("ArrowRight");
  await page.locator('.cameo[data-cameo="missingno"]').waitFor({ timeout: 20000 });
  await page.keyboard.up("ArrowRight");
  await wait(page, 2400);
  end("glitch");
  for (let i = 0; i < 6; i++) { await closeDialogs(page); await wait(page, 200); }
  await travelTo(page, /TALL GRASS/);
  await caption(page, TEXT.shiny, 230);
  begin();
  await findBattle(page);
  await wait(page, 3800);
  end("shiny");
});

await record("end", async ({ page, begin, end }) => {
  await openTitle(page);
  begin();
  await page.evaluate((social) => {
    const card = document.createElement("div");
    card.style.cssText =
      "position:fixed;inset:0;z-index:100000;background:#101820;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:28px;font-family:var(--font-pixelify),monospace;";
    card.innerHTML =
      '<p style="margin:0;font-size:84px;font-weight:700;color:#ffd23f;text-shadow:6px 6px 0 #2a4bd7;letter-spacing:4px">ROHIT RAJ SAJI</p>' +
      '<p style="margin:0;font-size:40px;color:#fff;letter-spacing:6px;background:#d94c4c;padding:8px 28px;border:4px solid #fff">AI ENGINEER</p>' +
      `<p style="margin:12px 0 0;font-size:34px;color:#fff;letter-spacing:3px">${social ? "GOTTA HIRE 'EM ALL" : "PRESS START TO PLAY"}</p>`;
    document.body.appendChild(card);
  }, variant === "social");
  await wait(page, 3200);
  end();
});

await browser.close();
