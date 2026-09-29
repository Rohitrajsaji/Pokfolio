"use client";

import type { ScreenRequest } from "@content/types";
import { useGame } from "../state/store";
import { AskScreen } from "./screens/AskScreen";
import { BagScreen } from "./screens/BagScreen";
import { ContactScreen } from "./screens/ContactScreen";
import { DexScreen } from "./screens/DexScreen";
import { CreditsScreen } from "./screens/CreditsScreen";
import { EvolutionScreen } from "./screens/EvolutionScreen";
import { HelpScreen } from "./screens/HelpScreen";
import { JobsScreen } from "./screens/JobsScreen";
import { OptionsScreen } from "./screens/OptionsScreen";
import { PartyScreen } from "./screens/PartyScreen";
import { PrizesScreen } from "./screens/PrizesScreen";
import { ResumeScreen } from "./screens/ResumeScreen";
import { TownMapScreen } from "./screens/TownMapScreen";
import { TrainerCardScreen } from "./screens/TrainerCardScreen";
import { VoltorbFlipScreen } from "./screens/VoltorbFlipScreen";

function Screen({ request }: { request: ScreenRequest }) {
  switch (request.screen) {
    case "dex":
      return <DexScreen project={request.project} />;
    case "party":
      return <PartyScreen job={request.job} />;
    case "evolution":
      return <EvolutionScreen />;
    case "bag":
      return <BagScreen shop={request.shop} />;
    case "card":
      return <TrainerCardScreen />;
    case "contact":
      return <ContactScreen />;
    case "jobs":
      return <JobsScreen />;
    case "ask":
      return <AskScreen />;
    case "map":
      return <TownMapScreen />;
    case "options":
      return <OptionsScreen />;
    case "resume":
      return <ResumeScreen />;
    case "help":
      return <HelpScreen />;
    case "credits":
      return <CreditsScreen />;
    case "voltorb":
      return <VoltorbFlipScreen />;
    case "prizes":
      return <PrizesScreen />;
  }
}

/** Full screens (Pokédex, Trainer Card, Town Map...) opened from the menu or the world. */
export function ContentScreens() {
  const overlay = useGame((state) => state.overlay);
  if (overlay?.kind !== "screen") return null;
  // Keyed by the overlay, so going back to a screen (or reopening it) starts it fresh.
  return <Screen key={overlay.id} request={overlay.request} />;
}
