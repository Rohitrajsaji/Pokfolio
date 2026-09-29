import Link from "next/link";
import { profile, site } from "@content";
import { Game } from "@/game/Game";

/**
 * The playable portfolio. The same essentials are in plain text below the
 * game for search engines and screen readers, and the classic résumé is one
 * link away.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#10131f] text-white">
      <a
        href="/resume"
        className="sr-only rounded bg-white px-3 py-2 text-[#10131f] focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to the classic résumé
      </a>
      <header className="mx-auto flex w-full max-w-[1024px] items-center justify-between gap-4 px-4 py-3">
        <p className="font-pixel text-sm tracking-wide sm:text-base">
          {profile.name}
          <span className="text-white/55"> · {profile.role}</span>
        </p>
        <Link
          href="/resume"
          className="shrink-0 rounded-md border border-white/30 px-3 py-1.5 font-pixel text-xs tracking-wide transition hover:border-white hover:bg-white hover:text-[#10131f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 sm:text-sm"
        >
          Classic résumé
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-3 pb-4">
        <h1 className="sr-only">{`${profile.name}, ${profile.role}: interactive portfolio`}</h1>
        <Game />
        <p className="controls-legend">
          Arrow keys or WASD to walk · Z or Enter to talk · M or Esc for the menu · Shift to run ·
          or click where you want to go
        </p>
        <section className="sr-only" aria-label={`About ${profile.name}`}>
          <h2>About {profile.name}</h2>
          {profile.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            Contact: <a href={`mailto:${profile.email}`}>{profile.email}</a>,{" "}
            <a href={profile.links.linkedin}>LinkedIn</a>, <a href={profile.links.github}>GitHub</a>
            .
          </p>
        </section>
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-4 text-center text-[0.7rem] leading-snug text-white/40">
        {site.disclaimer}
      </footer>
    </div>
  );
}
