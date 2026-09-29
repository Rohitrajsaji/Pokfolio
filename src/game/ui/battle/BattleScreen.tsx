"use client";

import { battle, site, skills } from "@content";
import type { PokemonRef } from "@content/types";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TYPE_COLORS } from "@/art/palette";
import { itemSpriteUrl, pokemonSpriteUrl, type SpriteView } from "@/pokeapi/sprites";
import { Sprite } from "@/ui/Sprite";
import {
  BALL_NAMES,
  BALLS,
  checkParty,
  fight,
  formFor,
  opening,
  run,
  startState,
  throwBall,
  type Ball,
  type BattleState,
  type Beat,
  type Cue,
} from "../../battle/battle";
import { useGame } from "../../state/store";
import { fill } from "../../text";
import { usePreloadedImages } from "../screens/parts";
import { useInputLayer } from "../useInputLayer";
import { useMenuNavigation } from "../useMenuNavigation";
import { useReducedMotion } from "../useReducedMotion";
import { useTypewriter } from "../useTypewriter";

/** One pixel of the 256-pixel-wide game screen, in container units (cqw). */
const GAME_PX = 100 / 256;
/** Sprite pixels per game pixel: the wild Pokémon, and your partner's closer back view. */
const WILD_SCALE = 1;
const PARTNER_SCALE = 1.6;
/** Keep these in step with the battle animations in globals.css. */
const INTRO_MS = 1300;
const THROW_MS = 1300;
const SHAKE_MS = 700;

const COMMANDS = [
  { id: "fight", label: "FIGHT" },
  { id: "bag", label: "BAG" },
  { id: "party", label: "POKéMON" },
  { id: "run", label: "RUN" },
] as const;

type Command = (typeof COMMANDS)[number]["id"];

const WILD_NAME = site.wild.nickname ?? site.wild.name;
const PARTNER_NAME = site.partner.nickname ?? site.partner.name;

/** Everything the battle might show, fetched while the intro plays. */
const BATTLE_IMAGES = [
  ...new Set([site.wild.dex, ...skills.map((category) => formFor(category.type))]),
]
  .map((id) => pokemonSpriteUrl(id))
  .concat(pokemonSpriteUrl(site.partner.dex, { view: "back" }), BALLS.map(itemSpriteUrl));

/** How the wild Pokémon and your partner move for each cue. */
const WILD_MOTION: Partial<Record<Cue, string>> = {
  "partner-attack": "is-hit",
  "wild-attack": "is-lunging",
  "form-change": "is-changing",
  paralyze: "is-zapped",
  throw: "is-absorbed",
  "break-free": "is-free",
};
const PARTNER_MOTION: Partial<Record<Cue, string>> = {
  "send-out": "is-sent",
  "partner-attack": "is-attacking",
};

/** Natural sizes of sprites already seen, so a re-drawn sprite never flickers. */
const naturalSizes = new Map<string, { width: number; height: number }>();

/** A sprite drawn at the battle's pixel scale, so every form keeps its true size. */
function BattleSprite({
  mon,
  view = "front",
  scale,
}: {
  mon: PokemonRef;
  view?: SpriteView;
  scale: number;
}) {
  const src = pokemonSpriteUrl(mon.dex, { view });
  const [size, setSize] = useState(() => naturalSizes.get(src) ?? null);
  const style: CSSProperties = size
    ? {
        width: `${size.width * scale * GAME_PX}cqw`,
        height: `${size.height * scale * GAME_PX}cqw`,
      }
    : // Hidden at its natural size until loaded, so it never shows stretched.
      { visibility: "hidden", width: "auto", height: "auto" };
  return (
    <Sprite
      src={src}
      alt=""
      size={96}
      className="battle-sprite"
      style={style}
      onLoad={(event) => {
        const loaded = {
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        };
        naturalSizes.set(src, loaded);
        setSize(loaded);
      }}
    />
  );
}

function HpBar({ hp }: { hp: number }) {
  const level = hp > 0.5 ? "high" : hp > 0.2 ? "mid" : "low";
  return (
    <span className="hp-row">
      <span className="hp-label">HP</span>
      <span className="hp-track">
        <span className="hp-fill" data-level={level} style={{ width: `${hp * 100}%` }} />
      </span>
    </span>
  );
}

function WildBox({ state }: { state: BattleState }) {
  const hp = Math.round(state.hp * 100);
  return (
    <div
      className="hp-box hp-box-wild ds-box"
      role="group"
      aria-label={`Wild ${WILD_NAME}, level ${battle.levels.wild}, ${hp}% HP${state.paralyzed ? ", paralyzed" : ""}`}
    >
      <p className="hp-name">
        <span>{WILD_NAME}</span>
        <span className="hp-level">Lv{battle.levels.wild}</span>
      </p>
      <HpBar hp={state.hp} />
      {state.paralyzed && <span className="hp-status">PAR</span>}
    </div>
  );
}

function PartnerBox() {
  const maxHp = battle.levels.partner * 2 + 10;
  return (
    <div
      className="hp-box hp-box-partner ds-box"
      role="group"
      aria-label={`${PARTNER_NAME}, level ${battle.levels.partner}, full HP`}
    >
      <p className="hp-name">
        <span>{PARTNER_NAME}</span>
        <span className="hp-level">Lv{battle.levels.partner}</span>
      </p>
      <HpBar hp={1} />
      <p className="hp-numbers">
        {maxHp}/{maxHp}
      </p>
    </div>
  );
}

/** The field: platforms, both Pokémon and any ball. `motionKey` restarts animations per line. */
function Scene({
  view,
  beat,
  motionKey,
  reducedMotion,
}: {
  view: BattleState;
  beat?: Beat;
  motionKey: string;
  reducedMotion: boolean;
}) {
  const cue = beat?.cue;
  const wildMotion = (cue && WILD_MOTION[cue]) ?? "";
  const partnerMotion = (cue && PARTNER_MOTION[cue]) ?? "";
  const ballMotion = cue === "throw" ? "is-thrown" : cue === "caught" ? "is-caught" : "";
  // Mid-throw, the wild Pokémon stays visible until it's pulled into the ball.
  const showWild = !view.ball || (cue === "throw" && !reducedMotion);
  return (
    <div className="battle-scene" aria-hidden>
      <span className="battle-platform battle-platform-wild" />
      <span className="battle-platform battle-platform-partner" />
      {showWild && (
        <div
          key={wildMotion ? `wild:${motionKey}` : "wild"}
          className={`battle-wild ${wildMotion}`}
        >
          <BattleSprite
            key={view.sprite}
            mon={{ ...site.wild, dex: view.sprite }}
            scale={WILD_SCALE}
          />
        </div>
      )}
      {view.ball && (
        <div
          key={ballMotion ? `ball:${motionKey}` : "ball"}
          className={`battle-ball ${ballMotion}`}
          style={{ "--shakes": beat?.shakes ?? 0 } as CSSProperties}
        >
          <Sprite src={itemSpriteUrl(view.ball)} alt="" size={30} className="battle-ball-sprite" />
        </div>
      )}
      {view.partnerOut && (
        <div
          key={partnerMotion ? `partner:${motionKey}` : "partner"}
          className={`battle-partner ${partnerMotion}`}
        >
          <BattleSprite mon={site.partner} view="back" scale={PARTNER_SCALE} />
        </div>
      )}
    </div>
  );
}

/** One line of battle text. A (or a click) finishes typing, then moves on. */
function BattleText({
  beat,
  id,
  waiting,
  onNext,
}: {
  beat: Beat;
  id: string;
  /** True while an animation still has to finish before the next line. */
  waiting: boolean;
  onNext: () => void;
}) {
  const { visible, typed, finish } = useTypewriter(beat.text, id);
  const advance = () => {
    if (!typed) return finish();
    if (!waiting) onNext();
  };
  useInputLayer((action) => {
    if (action === "a" || action === "b") advance();
  });
  return (
    <div className="dialog ds-box battle-text" onClick={advance} role="group" aria-label="Battle">
      <p className="dialog-text" aria-hidden>
        {beat.text.slice(0, visible)}
        <span className="invisible">{beat.text.slice(visible)}</span>
      </p>
      <p className="sr-only" aria-live="polite">
        {beat.text}
      </p>
      {typed && !waiting && (
        <span className="dialog-next" aria-hidden>
          ▼
        </span>
      )}
    </div>
  );
}

function CommandMenu({
  initial,
  onPick,
}: {
  initial: number;
  onPick: (command: Command, index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // There's no backing out of a battle except RUN.
  useMenuNavigation(ref, { onBack: () => {}, initial, columns: 2 });
  return (
    <div className="dialog ds-box battle-prompt">
      <p className="dialog-text">{fill(battle.text.prompt)}</p>
      <div ref={ref} className="battle-commands" role="menu" aria-label="Battle commands">
        {COMMANDS.map((command, index) => (
          <button
            key={command.id}
            type="button"
            role="menuitem"
            data-nav
            data-command={command.id}
            className="battle-command"
            onClick={() => onPick(command.id, index)}
          >
            {command.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MoveMenu({ onPick, onBack }: { onPick: (index: number) => void; onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useMenuNavigation(ref, { onBack, columns: 2 });
  return (
    <div className="dialog ds-box battle-submenu">
      <div ref={ref} className="battle-moves" role="menu" aria-label="Moves">
        {battle.moves.map((move, index) => (
          <button
            key={move.name}
            type="button"
            role="menuitem"
            data-nav
            className="battle-option"
            onClick={() => onPick(index)}
          >
            {move.name}
            <span className="type-badge" style={{ background: TYPE_COLORS[move.type] }}>
              {move.type.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="battle-cancel" onClick={onBack}>
        CANCEL
      </button>
    </div>
  );
}

function BagMenu({ onPick, onBack }: { onPick: (ball: Ball) => void; onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useMenuNavigation(ref, { onBack });
  return (
    <div className="dialog ds-box battle-submenu">
      <div ref={ref} className="battle-balls" role="menu" aria-label="Bag">
        {BALLS.map((ball) => (
          <button
            key={ball}
            type="button"
            role="menuitem"
            data-nav
            className="battle-option"
            onClick={() => onPick(ball)}
          >
            <Sprite src={itemSpriteUrl(ball)} alt="" size={30} className="battle-item-icon" />
            {BALL_NAMES[ball]}
          </button>
        ))}
      </div>
      <button type="button" className="battle-cancel" onClick={onBack}>
        CANCEL
      </button>
    </div>
  );
}

/** The catch-to-hire battle against the wild ROHIT. */
export function BattleScreen() {
  const reducedMotion = useReducedMotion();
  const [intro, setIntro] = useState(() => !reducedMotion);
  const [beats, setBeats] = useState<Beat[]>(() => opening(startState()));
  const [at, setAt] = useState(0);
  const [round, setRound] = useState(0);
  const [menu, setMenu] = useState<"commands" | "fight" | "bag">("commands");
  const [command, setCommand] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const timers = useRef(new Set<number>());
  usePreloadedImages(BATTLE_IMAGES);

  useEffect(() => {
    if (!intro) return;
    const id = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(id);
  }, [intro]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of pending) window.clearTimeout(id);
    };
  }, []);

  const settled = beats[beats.length - 1].state;
  const beat = at < beats.length ? beats[at] : undefined;
  const view = beat?.state ?? settled;

  /** A thrown ball has to finish shaking before the story can go on. */
  const waitFor = (next: Beat | undefined) => {
    if (next?.cue !== "throw" || reducedMotion) return setWaiting(false);
    setWaiting(true);
    const id = window.setTimeout(
      () => {
        timers.current.delete(id);
        setWaiting(false);
      },
      THROW_MS + (next.shakes ?? 0) * SHAKE_MS,
    );
    timers.current.add(id);
  };

  const play = (next: Beat[]) => {
    setBeats(next);
    setAt(0);
    setRound((n) => n + 1);
    setMenu("commands");
    waitFor(next[0]);
  };

  const onNext = () => {
    if (!beat) return;
    if (beat.end === "fled") return useGame.getState().closeOverlay();
    if (beat.end === "caught") {
      const game = useGame.getState();
      game.setCaught(true);
      return game.openScreen({ screen: "contact" });
    }
    setAt(at + 1);
    waitFor(beats[at + 1]);
  };

  const pick = (choice: Command, index: number) => {
    setCommand(index);
    if (choice === "fight") setMenu("fight");
    else if (choice === "bag") setMenu("bag");
    else play(choice === "party" ? checkParty(settled) : run(settled));
  };

  const lineId = `${round}:${at}`;
  return (
    <div
      className="battle"
      data-intro={intro ? "" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`Battle with the wild ${WILD_NAME}`}
    >
      <Scene
        view={view}
        beat={intro ? undefined : beat}
        motionKey={lineId}
        reducedMotion={reducedMotion}
      />
      {intro ? (
        <div className="battle-flash" aria-hidden />
      ) : (
        <>
          <WildBox state={view} />
          {view.partnerOut && <PartnerBox />}
          {beat ? (
            <BattleText beat={beat} id={lineId} waiting={waiting} onNext={onNext} />
          ) : menu === "fight" ? (
            <MoveMenu
              onPick={(move) => play(fight(settled, move))}
              onBack={() => setMenu("commands")}
            />
          ) : menu === "bag" ? (
            <BagMenu
              onPick={(ball) => play(throwBall(settled, ball))}
              onBack={() => setMenu("commands")}
            />
          ) : (
            <CommandMenu initial={command} onPick={pick} />
          )}
        </>
      )}
    </div>
  );
}
