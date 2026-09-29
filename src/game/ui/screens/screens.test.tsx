// @vitest-environment jsdom
import { dialogue, experience, professorQa, profile, projects, skills } from "@content";
import type { ScreenRequest } from "@content/types";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { input, type Action } from "../../engine/input";
import { matchQuestion } from "../../qa";
import { useGame } from "../../state/store";
import { fill, fillWith } from "../../text";
import { ContentScreens } from "../ContentScreens";
import { SCREEN_LINKS } from "./parts";

const press = (action: Action) =>
  act(() => {
    input.press(action);
    input.release(action);
  });

const open = (request: ScreenRequest) => {
  act(() => useGame.getState().openScreen(request));
  render(<ContentScreens />);
};

let reducedMotion = false;

class FakeImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

beforeAll(() => {
  // jsdom has no canvas or media queries; the screens only need them to exist.
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("reduced-motion") && reducedMotion,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
  vi.stubGlobal("ImageData", FakeImageData);
  HTMLCanvasElement.prototype.getContext = (() => ({
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
});

beforeEach(() => {
  reducedMotion = false;
  useGame.setState({ overlay: null });
});

afterEach(() => {
  cleanup();
  input.releaseAll();
  vi.useRealTimers();
});

describe("every screen", () => {
  it.each([
    [{ screen: "dex" }, "POKéDEX"],
    [{ screen: "party" }, "POKéMON"],
    [{ screen: "evolution" }, "EVOLUTION"],
    [{ screen: "bag" }, "BAG"],
    [{ screen: "bag", shop: true }, "POKé MART"],
    [{ screen: "card" }, "TRAINER CARD"],
    [{ screen: "contact" }, "POKéGEAR"],
    [{ screen: "jobs" }, "JOB BOARD"],
    [{ screen: "ask" }, "ASK THE PROFESSOR"],
    [{ screen: "map" }, "TOWN MAP"],
    [{ screen: "options" }, "OPTIONS"],
  ] satisfies Array<[ScreenRequest, string]>)(
    "%o opens as %s, cursor ready, and B closes it",
    (request, title) => {
      open(request);
      const frame = screen.getByRole("dialog", { name: title });
      expect(frame.querySelector("[data-current]")).not.toBeNull();
      press("b");
      expect(useGame.getState().overlay).toBeNull();
    },
  );
});

describe("POKéDEX", () => {
  const heading = () => screen.getByRole("heading", { level: 3 }).textContent;

  it("opens on the requested project", () => {
    const last = projects[projects.length - 1];
    open({ screen: "dex", project: last.id });
    expect(heading()).toBe(last.name.toUpperCase());
  });

  it("shows whichever entry the cursor is on", () => {
    open({ screen: "dex" });
    expect(heading()).toBe(projects[0].name.toUpperCase());
    press("down");
    expect(heading()).toBe(projects[1].name.toUpperCase());
  });
});

describe("BAG and POKé MART", () => {
  it("switches pockets as the cursor moves along them", () => {
    open({ screen: "bag" });
    press("right");
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe(skills[1].name);
    expect(screen.getByText(skills[1].skills[0])).toBeTruthy();
  });

  it("won't sell a skill, but points the way to the job board", () => {
    open({ screen: "bag", shop: true });
    const skill = skills[0].skills[0];
    fireEvent.click(screen.getByRole("button", { name: (name) => name.includes(skill) }));
    const refusal = fillWith(dialogue.shop.refusal[0], { item: `TM01 ${skill.toUpperCase()}` });
    expect(screen.getByText(refusal)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `▶ ${SCREEN_LINKS.jobs}` }));
    expect(useGame.getState().overlay).toMatchObject({ request: { screen: "jobs" } });
  });
});

describe("EVOLUTION", () => {
  const stages = [...experience].sort((a, b) => a.start.localeCompare(b.start));
  const evolved = (i: number) =>
    fillWith(dialogue.evolution.evolved, {
      from: stages[i - 1].mascot.name,
      to: stages[i].mascot.name,
    });

  it("steps through the career oldest first, then closes", () => {
    reducedMotion = true;
    open({ screen: "evolution" });
    for (let i = 1; i < stages.length; i++) {
      press("a");
      expect(screen.getByText(evolved(i))).toBeTruthy();
    }
    const last = stages[stages.length - 1].mascot.name;
    expect(screen.getByText(fillWith(dialogue.evolution.done, { to: last }))).toBeTruthy();
    press("a");
    expect(useGame.getState().overlay).toBeNull();
  });

  it("flashes for a while before the new form appears", () => {
    vi.useFakeTimers();
    open({ screen: "evolution" });
    press("a");
    const evolving = fillWith(dialogue.evolution.evolving, { from: stages[0].mascot.name });
    expect(screen.getByText(evolving)).toBeTruthy();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(evolved(1))).toBeTruthy();
  });
});

describe("ASK THE PROFESSOR", () => {
  it("answers a topic, then offers the screen with the details", () => {
    const topic = professorQa.topics.find((entry) => entry.then);
    if (!topic?.then) throw new Error("expected a topic that opens a screen");
    open({ screen: "ask" });
    fireEvent.click(screen.getByRole("button", { name: topic.label }));
    expect(screen.getByText(fill(topic.answer[0]))).toBeTruthy();
    const follow = screen.getByRole("button", { name: `▶ ${SCREEN_LINKS[topic.then.screen]}` });
    expect(document.activeElement).toBe(follow);
    fireEvent.click(follow);
    expect(useGame.getState().overlay).toMatchObject({
      request: topic.then,
      back: { kind: "screen", request: { screen: "ask" } },
    });
  });

  it("matches typed questions, and admits when it has no notes", () => {
    open({ screen: "ask" });
    const field = screen.getByRole("textbox", { name: "Ask your own question" });
    const ask = (question: string) => {
      fireEvent.change(field, { target: { value: question } });
      fireEvent.click(screen.getByRole("button", { name: "ASK" }));
    };

    const question = "Are you open to relocating?";
    const topic = matchQuestion(professorQa, question);
    if (!topic) throw new Error(`expected a topic for "${question}"`);
    ask(question);
    expect(screen.getByText(fill(topic.answer[0]))).toBeTruthy();

    ask("What's your favourite colour?");
    expect(screen.getByText(fill(professorQa.fallback[0]))).toBeTruthy();
    expect(screen.queryByRole("button", { name: (name) => name.startsWith("▶") })).toBeNull();
  });

  it("lets the D-pad cursor leave the text field", () => {
    open({ screen: "ask" });
    const field = screen.getByRole("textbox");
    act(() => field.focus());
    fireEvent.keyDown(field, { key: "ArrowUp" });
    const lastTopic = professorQa.topics[professorQa.topics.length - 1];
    expect(document.activeElement).toBe(screen.getByRole("button", { name: lastTopic.label }));
  });
});

describe("POKéGEAR", () => {
  it("links to email, LinkedIn and GitHub, opening profiles in a new tab", () => {
    open({ screen: "contact" });
    const email = screen.getByRole("link", { name: profile.email });
    expect(email.getAttribute("href")).toBe(`mailto:${profile.email}`);
    for (const url of [profile.links.linkedin, profile.links.github]) {
      const link = document.querySelector(`a[href="${url}"]`);
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.getAttribute("rel")).toContain("noopener");
    }
  });

  it("copies the email address", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    open({ screen: "contact" });
    fireEvent.click(screen.getByRole("button", { name: "COPY" }));
    expect(await screen.findByRole("button", { name: "COPIED!" })).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(profile.email);
  });

  it("shows the address instead when copying isn't allowed", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    open({ screen: "contact" });
    fireEvent.click(screen.getByRole("button", { name: "COPY" }));
    expect(await screen.findByText(/Couldn't copy automatically/)).toBeTruthy();
  });
});
