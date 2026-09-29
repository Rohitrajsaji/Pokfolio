# Rohit Raj Saji — Pokémon-style portfolio

A portfolio you can play. Walk around a pixel-art town, step into buildings to read about
projects and experience, and catch the wild ROHIT in the tall grass to get in touch. Recruiters
in a hurry can pick RÉSUMÉ on the title screen (or in the START menu) for the whole résumé, in
the game's own tabbed pages, with a PRINT button for a clean paper copy.

> **Status:** Built and ready to deploy: the title screen and intro, the playable town, menus,
> every content screen, the professor's Q&A, the catch-to-hire battle, music and sound effects,
> a favicon and a share image. The one step left is publishing it (see
> [Deploying](#deploying)). The art kit is previewable at
> [`/dev/sprites`](http://localhost:3000/dev/sprites) while `npm run dev` is running.

### How to play

| Keys               | Touch        | Does                                        |
| ------------------ | ------------ | ------------------------------------------- |
| Arrow keys or WASD | D-pad or tap | Walk (tap a building or person to go there) |
| Z, Enter or Space  | A            | Talk, read, choose                          |
| X or Backspace     | B            | Back; hold to run                           |
| M or Esc           | START        | Open the menu                               |
| Shift              |              | Run                                         |

The game opens on a title screen: press START (or A, or tap it). The professor's short intro
follows, and SKIP, START or ESC cuts straight to the town.

Every building opens part of the portfolio: the Lab holds the projects (Pokédex), the Career Gym
the experience, the house the Trainer Card, the Poké Mart the skills and the Pokémon Center the
contact details. Step into the tall grass to meet the wild ROHIT, and catch it to get in touch.

The whole site is one full-window pixel-art game: the view adapts to any window shape at a
crisp whole-number pixel scale, every button, scrollbar and cursor is pixel art, and a
FULLSCREEN button (or the home-screen app on iPhone) removes the browser chrome. On phones a
pixel handheld pad appears around the game. HELP and CREDITS live on the title screen and in
OPTIONS. `src/app/look.test.ts` guards the look (no rounded corners, blur or smooth fonts).

Sound starts off. Turn it on with the SOUND button on the title screen or in OPTIONS. The music
and sound effects are original, synthesised in the browser as the game runs; the Pokémon cries
come from PokeAPI.

### Secrets

A few things are hidden in the town for curious visitors: a hidden Game Corner with a faithful
VOLTORB FLIP (clearing levels wins a trainer look and a screen palette, for that visit only),
and five Pokémon-lore nods in the world itself. Nothing is remembered between visits. They are
all plain content, so you can reword or move them:

- `visits` on any sign, person or piece of furniture (`content/world.ts`) says something different
  from the Nth time it is talked to; `effect` can unlock a secret, play a cry or a jingle, or start a
  cameo (a Pokémon in the TV, a screen glitch).
- `routes` in the town spec sets off an effect when the visitor walks a line of tiles in one go.
- `content/cosmetics.ts` lists the trainer looks and screen palettes, and `content/dialogue.ts` holds
  the Voltorb Flip and prize text.

### Your in-game look

Prof. Rohit's sprite is drawn from `avatar` in [`content/site.ts`](content/site.ts): hairstyle
(`short`, `long`, `buns`, `bald` or `cap`), hair colour, skin tone, glasses, and shirt, coat and
trouser colours. Shadows and highlights are worked out automatically. The favicon, the
home-screen icon and the share image shown when someone posts a link are drawn from the same
settings and from `gameTitle`, so they follow when you rebuild.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

## Editing your content

Everything a visitor reads lives in [`content/`](content). You never need to touch game code to
update the portfolio — the town, the résumé and the search-engine data are all built from these
files.

| File                                               | What it holds                                                      | Where it shows up                     |
| -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| [`content/profile.ts`](content/profile.ts)         | Name, contact links, summary, education, certifications, languages | Résumé header, Trainer Card, contact  |
| [`content/experience.ts`](content/experience.ts)   | Jobs, most recent first                                            | Résumé, the Gym (career)              |
| [`content/projects.ts`](content/projects.ts)       | Projects                                                           | Résumé, Prof. Rohit's Lab (Pokédex)   |
| [`content/skills.ts`](content/skills.ts)           | Skill categories                                                   | Résumé, Poké Mart (TMs), battle moves |
| [`content/preferences.ts`](content/preferences.ts) | Roles you're open to                                               | Résumé, the town's job board          |
| [`content/site.ts`](content/site.ts)               | Titles, SEO text, partner and wild Pokémon, sprite source          | Everywhere                            |
| [`content/world.ts`](content/world.ts)             | The town map, buildings, rooms, signs and what everyone says       | The town                              |
| [`content/qa.ts`](content/qa.ts)                   | The professor's topics, keywords and answers                       | Prof. Rohit in the Lab                |
| [`content/battle.ts`](content/battle.ts)           | Your partner's moves, levels and every battle line                 | The battle in the tall grass          |
| [`content/dialogue.ts`](content/dialogue.ts)       | Other game text: the intro, welcome, evolution, the Mart clerk     | Around the game                       |

The shapes are defined in [`content/types.ts`](content/types.ts), so your editor autocompletes
fields and the build fails if something is missing or misspelled. Game text can use `{name}`,
`{town}`, `{partner}` and `{wild}`; they're filled in from `profile.ts` and `site.ts`.

### Example: add a project

Copy an entry in `content/projects.ts` and change it:

```ts
{
  id: "new-thing",                       // unique, kebab-case
  name: "New Thing",
  tagline: "What it is in a few words",
  status: "Ongoing",                     // optional
  summary: "One or two sentences about what you built.",
  highlightsTitle: "Features",
  highlights: ["First highlight", "Second highlight"],
  tags: ["Next.js", "Python"],
  links: { github: "https://github.com/rohitrajsaji/new-thing" }, // optional
  mascot: { dex: 150, name: "MEWTWO", types: ["psychic"] },
},
```

### Rules of thumb

- **Dates** are `"YYYY-MM"` (e.g. `"2026-03"`). Use `end: "present"` for a current role.
- **Pokémon** are referenced by National Pokédex number (`dex`). Numbers 1–649 have animated
  sprites. Names are written in CAPS, as in the games.
- **Never name the retail client.** A test fails the build if "Costco" appears anywhere.
- After editing, run `npm run check`. It type-checks, lints, runs the content tests and builds.

## Scripts

| Command          | What it does                                                        |
| ---------------- | ------------------------------------------------------------------- |
| `npm run dev`    | Start the dev server                                                |
| `npm run check`  | Typecheck, lint, test and build — run before every deploy           |
| `npm test`       | Run the unit and content tests once (`npm run test:watch` to watch) |
| `npm run format` | Format everything with Prettier                                     |

### Testing

`npm run check` runs the typecheck, lint, unit tests and a production build. `npm run e2e` adds
real-browser smoke tests in Chrome and Playwright's WebKit (Safari); set `E2E_FIREFOX=1` to add
Firefox (`npx playwright install webkit firefox` first). They cover window shapes from a 320px
phone to 4K, keyboard-only play, the printed résumé, PokeAPI offline, reduced motion, the hidden
Game Corner and Voltorb Flip, and each easter egg. It builds
the site and serves it on port 3200 itself.

## Deploying

The site is fully static, so it deploys to Vercel with no configuration.

1. Put the project on GitHub: create an empty repository, then
   `git remote add origin <the repository's URL>` and `git push -u origin main`.
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repository and
   press **Deploy**. Vercel recognises Next.js by itself.
3. On a custom domain, add the environment variable `NEXT_PUBLIC_SITE_URL` (for example
   `https://rohitrajsaji.dev`) and redeploy, so canonical links, the sitemap and the share image
   use it. On the free `*.vercel.app` address nothing needs setting.

Without GitHub, the Vercel CLI works from this folder: `npx vercel` makes a preview and
`npx vercel --prod` goes live. The first run asks you to log in.

Once it's live, paste the address into a link preview, such as LinkedIn's Post Inspector, to see
the share image.

## Credits

Pokémon and all related names, sprites and sounds are trademarks and © of Nintendo, Creatures
Inc. and GAME FREAK Inc. This is a non-commercial fan tribute used as a personal portfolio.
Official sprites and cries are loaded from [PokeAPI](https://github.com/PokeAPI/sprites); the
town art, music and code are original.
