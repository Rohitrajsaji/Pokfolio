"use client";

import type { ScreenRequest } from "@content/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGame } from "../state/store";
import { AskScreen } from "./screens/AskScreen";
import { BagScreen } from "./screens/BagScreen";
import { ContactScreen } from "./screens/ContactScreen";
import { DexScreen } from "./screens/DexScreen";
import { EvolutionScreen } from "./screens/EvolutionScreen";
import { JobsScreen } from "./screens/JobsScreen";
import { OptionsScreen } from "./screens/OptionsScreen";
import { PartyScreen } from "./screens/PartyScreen";
import { TownMapScreen } from "./screens/TownMapScreen";
import { TrainerCardScreen } from "./screens/TrainerCardScreen";

function ResumeRedirect() {
  const router = useRouter();
  useEffect(() => {
    useGame.getState().closeAll();
    router.push("/resume");
  }, [router]);
  return null;
}

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
      return <ResumeRedirect />;
  }
}

/** Full screens (Pokédex, Trainer Card, Town Map...) opened from the menu or the world. */
export function ContentScreens() {
  const overlay = useGame((state) => state.overlay);
  if (overlay?.kind !== "screen") return null;
  // Keyed by the overlay, so going back to a screen (or reopening it) starts it fresh.
  return <Screen key={overlay.id} request={overlay.request} />;
}
