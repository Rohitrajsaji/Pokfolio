import type { Interaction } from "@content/types";
import { fill } from "../text";
import { useGame } from "./store";

/**
 * Plays out an interaction from content: its lines, then an optional YES/NO
 * question, then the screen it opens.
 */
export function runInteraction(interaction: Interaction, speaker?: string): void {
  const { say, openScreen } = useGame.getState();
  const pages = (interaction.lines ?? []).map(fill);
  const name = speaker ? fill(speaker) : undefined;
  const proceed = () => {
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
