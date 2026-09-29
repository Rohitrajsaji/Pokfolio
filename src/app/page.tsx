import { profile } from "@content";
import { Game } from "@/game/Game";
import { ResumeText } from "./ResumeText";

/**
 * The whole page is the game. Everything in it is also on the page as plain
 * text, hidden from the eye, for search engines, screen readers and printing.
 */
export default function HomePage() {
  return (
    <main>
      <h1 className="sr-only">{`${profile.name}, ${profile.role}: interactive portfolio`}</h1>
      <Game />
      <ResumeText />
    </main>
  );
}
