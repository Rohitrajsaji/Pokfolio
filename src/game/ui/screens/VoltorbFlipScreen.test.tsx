// @vitest-environment jsdom
import { dialogue } from "@content";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { input, type Action } from "../../engine/input";
import { DEFAULT_COSMETICS, useGame } from "../../state/store";
import { fillWith } from "../../text";
import { makeBoard, seeded, SIZE } from "../../voltorb/board";
import { ContentScreens } from "../ContentScreens";

vi.mock("../../audio/sound", () => ({ sound: { sfx: vi.fn(), cry: vi.fn() } }));

const SEED = 7;
/** The board the screen deals first with `?vf=7`. */
const firstBoard = () => makeBoard(1, seeded(SEED));

class FakeImageData {
  constructor(
    readonly data: Uint8ClampedArray,
    readonly width: number,
    readonly height: number,
  ) {}
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: false,
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

const press = (action: Action) =>
  act(() => {
    input.press(action);
    input.release(action);
  });

/** Opens the game, with the how-to page already read (as it is on every visit after the first). */
function play({ seen = true }: { seen?: boolean } = {}) {
  window.history.pushState({}, "", `/?vf=${SEED}`);
  useGame.setState({
    overlay: null,
    cleared: 0,
    cosmetics: DEFAULT_COSMETICS,
    visits: seen ? { "voltorb:howto": 1 } : {},
  });
  act(() => useGame.getState().openScreen({ screen: "voltorb" }));
  render(<ContentScreens />);
}

const cards = () => screen.getAllByRole("button", { name: /^Row \d, column \d:/ });
const current = () => document.querySelector("[data-current]")?.getAttribute("aria-label");
const stat = (label: string) =>
  [...document.querySelectorAll(".vf-stat")]
    .find((row) => row.textContent?.startsWith(label))
    ?.textContent?.slice(label.length);

/** The card indexes worth more than 1 on a board, and one Voltorb. */
function wins(board: ReturnType<typeof firstBoard>) {
  return board.cards.flatMap((value, i) => (value >= 2 ? [i] : []));
}

afterEach(() => {
  cleanup();
  input.releaseAll();
  vi.clearAllMocks();
});

describe("VOLTORB FLIP", () => {
  beforeEach(() => window.history.pushState({}, "", "/"));

  it("explains the game the first time, and goes straight to the board after", () => {
    play({ seen: false });
    expect(screen.getByText(dialogue.voltorb.howTo[0])).toBeTruthy();
    expect(screen.queryAllByRole("button", { name: /^Row \d/ })).toHaveLength(0);
    press("a");
    expect(cards()).toHaveLength(SIZE * SIZE);
    expect(useGame.getState().visits["voltorb:howto"]).toBe(1);

    cleanup();
    play();
    expect(cards()).toHaveLength(SIZE * SIZE);
    expect(screen.queryByText(dialogue.voltorb.howTo[0])).toBeNull();
  });

  it("brings the how-to back on request", () => {
    play();
    fireEvent.click(screen.getByRole("button", { name: "HOW TO PLAY" }));
    expect(screen.getByText(dialogue.voltorb.howTo[0])).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "GOT IT" }));
    expect(cards()).toHaveLength(SIZE * SIZE);
  });

  it("shows each row's and column's points and Voltorbs, as the board really has them", () => {
    play();
    const board = firstBoard();
    board.rows.forEach((clue, i) => {
      expect(
        screen.getByLabelText(`Row ${i + 1}: ${clue.points} points, ${clue.voltorbs} VOLTORB`),
      ).toBeTruthy();
    });
    board.cols.forEach((clue, i) => {
      expect(
        screen.getByLabelText(`Column ${i + 1}: ${clue.points} points, ${clue.voltorbs} VOLTORB`),
      ).toBeTruthy();
    });
  });

  it("turns a card over and multiplies the coins", () => {
    play();
    const board = firstBoard();
    const [a, b] = wins(board);
    fireEvent.click(cards()[a]);
    expect(cards()[a].getAttribute("aria-label")).toContain(String(board.cards[a]));
    expect(stat("ROUND")).toBe(String(board.cards[a]));
    if (wins(board).length > 2) {
      fireEvent.click(cards()[b]);
      expect(stat("ROUND")).toBe(String(board.cards[a] * board.cards[b]));
    }
  });

  it("loses the round to a Voltorb: the board is shown, the coins are gone, and TRY AGAIN deals another", () => {
    play();
    const voltorb = firstBoard().cards.indexOf(0);
    fireEvent.click(cards()[voltorb]);
    expect(screen.getByRole("status").textContent).toContain("BOOM");
    expect(stat("ROUND")).toBe("0");
    // Everything's face up now.
    expect(cards().every((card) => !card.getAttribute("aria-label")?.includes("face down"))).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "TRY AGAIN" }));
    expect(stat("LEVEL")).toBe("1/3");
    expect(cards().every((card) => card.getAttribute("aria-label")?.includes("face down"))).toBe(
      true,
    );
  });

  it("clears a level once every 2 and 3 is flipped, banks the coins, and moves up", () => {
    play();
    const board = firstBoard();
    for (const i of wins(board)) fireEvent.click(cards()[i]);
    const coins = wins(board).reduce((product, i) => product * board.cards[i], 1);
    expect(screen.getByRole("status").textContent).toContain(
      fillWith(dialogue.voltorb.won, { coins: String(coins) }),
    );
    expect(stat("TOTAL")).toBe(String(coins));
    expect(useGame.getState().cleared).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "NEXT LEVEL" }));
    expect(stat("LEVEL")).toBe("2/3");
    expect(stat("TOTAL")).toBe(String(coins));
  });

  it("tells you about the prize a level wins", () => {
    play();
    for (const i of wins(firstBoard())) fireEvent.click(cards()[i]);
    expect(screen.getByRole("status").textContent).toContain("SPARKY");
  });

  it("moves the cursor around the board with the arrows, and on to the buttons below it", () => {
    play();
    expect(current()).toBe("Row 1, column 1: face down");
    press("right");
    expect(current()).toBe("Row 1, column 2: face down");
    press("down");
    expect(current()).toBe("Row 2, column 2: face down");
    press("left");
    press("left");
    expect(current()).toBe("Row 2, column 5: face down");
    // Up from the top row wraps round to the bottom of the screen: the last button, then the pens, then the board.
    press("up");
    press("up");
    expect(document.querySelector("[data-current]")?.textContent).toBe("HOW TO PLAY");
    press("up");
    expect(document.querySelector("[data-current]")?.getAttribute("role")).toBe("radio");
    press("up");
    expect(current()).toBe("Row 5, column 1: face down");
  });

  it("B picks a pen, and A then puts that note on a card instead of flipping it", () => {
    play();
    press("b");
    expect(screen.getByRole("radio", { name: "V" }).getAttribute("aria-checked")).toBe("true");
    press("a");
    expect(cards()[0].getAttribute("aria-label")).toContain("noted as VOLTORB");
    expect(cards()[0].getAttribute("aria-label")).toContain("face down");
    press("b");
    press("a");
    expect(cards()[0].getAttribute("aria-label")).toContain("noted as VOLTORB, 1");
    // The same pen again takes the note off.
    press("a");
    expect(cards()[0].getAttribute("aria-label")).toContain("noted as VOLTORB");
    expect(cards()[0].getAttribute("aria-label")).not.toContain("VOLTORB, 1");
    // Round the pens and back to flipping.
    press("b");
    press("b");
    press("b");
    expect(screen.getByRole("radio", { name: "FLIP" }).getAttribute("aria-checked")).toBe("true");
  });

  it("closes with START, the close button, or B once the round is over", () => {
    play();
    press("start");
    expect(useGame.getState().overlay).toBeNull();

    cleanup();
    play();
    fireEvent.click(cards()[firstBoard().cards.indexOf(0)]);
    press("b");
    expect(useGame.getState().overlay).toBeNull();
  });

  it("carries you through all three levels to a finish that just closes", () => {
    play();
    const rng = seeded(SEED);
    const boards = [makeBoard(1, rng), makeBoard(2, rng), makeBoard(3, rng)];
    for (const board of boards) {
      for (const i of wins(board)) fireEvent.click(cards()[i]);
      const carryOn = screen.getByRole("button", { name: /NEXT LEVEL|FINISH/ });
      fireEvent.click(carryOn);
    }
    expect(useGame.getState().cleared).toBe(3);
    expect(screen.getByRole("status").textContent).toContain("champion");
    fireEvent.click(screen.getByRole("button", { name: "DONE" }));
    expect(useGame.getState().overlay).toBeNull();
  });
});
