import { dialogue } from "@content";
import type { Effect, Interaction, Visit } from "@content/types";
import { sound } from "../audio/sound";
import { fill } from "../text";
import { useGame } from "./store";

/** The version of an interaction for this visit: the latest of its `visits` that has come round, else the plain one. */
export function forVisit(interaction: Interaction, visit: number): Interaction {
  let latest: Visit | undefined;
  for (const candidate of interaction.visits ?? []) {
    if (candidate.from <= visit && (!latest || candidate.from >= latest.from)) latest = candidate;
  }
  if (!latest) return interaction;
  const replacement: Partial<Visit> = { ...latest };
  delete replacement.from;
  return replacement;
}

function applyEffect(effect: Effect | undefined): void {
  if (!effect) return;
  if (effect.jingle) sound.playJingle(effect.jingle);
  if (effect.cry !== undefined) sound.cry(effect.cry);
  if (effect.unlock) {
    // The glitch that goes with a cameo makes its own noise.
    if (!effect.cameo) sound.sfx("unlock");
    useGame.getState().unlock(effect.unlock);
  }
  if (effect.cameo) useGame.getState().showCameo(effect.cameo, effect.after);
}

/**
 * Plays out an interaction from content: its lines, then an optional YES/NO
 * question, then its effect and the screen it opens. With a `visitKey`, coming
 * back to the same thing can change what it says (see `Interaction.visits`).
 */
export function runInteraction(base: Interaction, speaker?: string, visitKey?: string): void {
  const { say, openScreen } = useGame.getState();
  const interaction =
    visitKey && base.visits ? forVisit(base, useGame.getState().visit(visitKey)) : base;
  const pages = (interaction.lines ?? []).map(fill);
  const name = speaker ? fill(speaker) : undefined;
  const proceed = () => {
    applyEffect(interaction.effect);
    if (interaction.then) openScreen(interaction.then);
  };

  if (interaction.confirm) {
    const { question, no } = interaction.confirm;
    say({
      pages,
      speaker: name,
      ask: fill(question),
      onClose: (yes) => {
        if (yes) proceed();
        else if (no && no.length > 0)
          useGame.getState().say({ pages: no.map(fill), speaker: name });
      },
    });
    return;
  }
  if (pages.length === 0) return proceed();
  say({ pages, speaker: name, onClose: proceed });
}

/** Ends the title and the intro: the adventure begins, and the controls are explained. */
export function beginAdventure(): void {
  const game = useGame.getState();
  game.setStage("play");
  game.say({ pages: dialogue.welcome.map(fill) });
}
