import Link from "next/link";
import { profile, site } from "@content";
import { pokemonSpriteUrl } from "@/pokeapi/sprites";
import { Sprite } from "@/ui/Sprite";

/** Temporary title screen. The playable town replaces this in a later phase. */
export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#10131f] px-6 py-16 text-center text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#2c3e7a_0%,transparent_60%)]"
      />
      <Sprite
        src={pokemonSpriteUrl(site.wild.dex)}
        alt={`${site.wild.name}, the Pokémon that represents ${profile.shortName}`}
        size={96}
        preload
        className="relative h-40 w-40 sm:h-48 sm:w-48"
      />
      <h1 className="logo-text relative mt-4 font-pixel text-4xl font-bold tracking-wide sm:text-6xl">
        {site.gameTitle}
      </h1>
      <p className="relative mt-5 font-pixel text-lg tracking-[0.3em] text-sky-200 sm:text-xl">
        {site.gameSubtitle}
      </p>
      <p className="relative mt-10 max-w-md text-sm leading-relaxed text-white/70">
        {site.townName} is under construction. Until the adventure opens, the classic résumé has
        everything about {profile.name}, {profile.role}.
      </p>
      <Link
        href="/resume"
        className="relative mt-6 rounded-md border-2 border-white/80 bg-white/5 px-5 py-2.5 font-pixel text-sm tracking-wide transition hover:bg-white hover:text-[#10131f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
      >
        View classic résumé ▶
      </Link>
      <p className="absolute inset-x-0 bottom-4 mx-auto max-w-2xl px-6 text-[0.7rem] leading-snug text-white/40">
        {site.disclaimer}
      </p>
    </main>
  );
}
