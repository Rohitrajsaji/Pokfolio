@AGENTS.md

# Project conventions

- All portfolio text lives in `content/*.ts`, typed by `content/types.ts`. Components read it
  through the `@content` alias; never hardcode résumé text in components.
- Never name the retail client (Costco). `content/content.test.ts` enforces this.
- Build official sprite and cry URLs only through `src/pokeapi/sprites.ts`, and render sprites
  with `src/ui/Sprite.tsx`.
- Tests are Vitest, colocated as `*.test.ts` next to the code they cover.
- Before finishing any change, run `npm run check` (typecheck, lint, tests, build).
- Next.js 16 differs from older versions: `next/image` uses `preload` instead of `priority`,
  `params` are async, and `next lint` is gone (use `npm run lint`).
