"use client";

import { profile, site } from "@content";
import type { PokemonRef, PokeType, ScreenRequest } from "@content/types";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactEventHandler,
  type ReactNode,
} from "react";
import { avatarLook } from "@/art/characters";
import { paintBuffer } from "@/art/canvas";
import { TYPE_COLORS } from "@/art/palette";
import { PORTRAIT_HEIGHT, PORTRAIT_WIDTH, portraitBuffer } from "@/art/portrait";
import { pokemonSpriteUrl } from "@/pokeapi/sprites";
import { Sprite } from "@/ui/Sprite";

/** Button text for jumping to another screen, e.g. from the professor's answers. */
export const SCREEN_LINKS: Readonly<Record<ScreenRequest["screen"], string>> = {
  dex: "OPEN THE POKéDEX",
  party: "SEE THE CAREER",
  evolution: "WATCH THE EVOLUTION",
  bag: "OPEN THE BAG",
  card: "SEE THE TRAINER CARD",
  contact: "OPEN THE POKéGEAR",
  jobs: "READ THE JOB BOARD",
  ask: "ASK THE PROFESSOR",
  map: "OPEN THE TOWN MAP",
  options: "OPEN THE OPTIONS",
  help: "OPEN THE HELP",
  credits: "OPEN THE CREDITS",
  resume: "READ THE RÉSUMÉ",
  voltorb: "PLAY VOLTORB FLIP",
  prizes: "SEE THE PRIZES",
};

export function TypeBadges({ types }: { types?: readonly PokeType[] }) {
  if (!types?.length) return null;
  return (
    <span className="type-badges">
      {types.map((type) => (
        <span key={type} className="type-badge" style={{ background: TYPE_COLORS[type] }}>
          {type.toUpperCase()}
        </span>
      ))}
    </span>
  );
}

/** A Pokémon's official battle sprite. `decorative` hides it from screen readers. */
export function MonSprite({
  mon,
  view = "front",
  decorative = false,
  className,
  style,
  onLoad,
}: {
  mon: PokemonRef;
  view?: "front" | "back";
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
  onLoad?: ReactEventHandler<HTMLImageElement>;
}) {
  return (
    <Sprite
      src={pokemonSpriteUrl(mon.dex, { view })}
      alt={decorative ? "" : (mon.nickname ?? mon.name)}
      size={96}
      className={className ? `mon-sprite ${className}` : "mon-sprite"}
      style={style}
      onLoad={onLoad}
    />
  );
}

/** Starts downloading images before they're shown, so they don't pop in late. */
export function usePreloadedImages(urls: readonly string[]): void {
  useEffect(() => {
    for (const url of urls) new Image().src = url;
  }, [urls]);
}

/** A text box inside a screen: who's talking, what they say, and any buttons. */
export function MessageBox({
  speaker,
  lines,
  children,
}: {
  speaker?: string;
  lines: readonly string[];
  children?: ReactNode;
}) {
  return (
    <div className="message-box">
      {speaker && <p className="message-speaker">{speaker}</p>}
      <div aria-live="polite">
        {lines.map((line, index) => (
          <p key={index} className="message-line">
            {line}
          </p>
        ))}
      </div>
      {children}
    </div>
  );
}

/** Prof. Rohit's portrait, drawn from `site.avatar`. */
export function AvatarPortrait({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintBuffer(ref.current, portraitBuffer(avatarLook(site.avatar)));
  }, []);
  return (
    <canvas
      ref={ref}
      width={PORTRAIT_WIDTH}
      height={PORTRAIT_HEIGHT}
      className={className ? `avatar-portrait ${className}` : "avatar-portrait"}
      role="img"
      aria-label={`${profile.name} as a pixel-art trainer`}
    />
  );
}
