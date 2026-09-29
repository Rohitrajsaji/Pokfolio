import { professorQa } from "@content";
import { describe, expect, it } from "vitest";
import { matchQuestion } from "./qa";

const topicFor = (question: string) => matchQuestion(professorQa, question)?.label ?? null;

describe("matchQuestion", () => {
  it.each([
    ["What do you do at UST?", "Current role"],
    ["Tell me about the legacy modernization work", "Current role"],
    ["Which projects have you built?", "Projects"],
    ["What is Mnemo?", "Projects"],
    ["Do you work with LLMs and agents?", "Agents & AI"],
    ["Do you know React and Spring Boot?", "Skills"],
    ["Where did you study?", "Education"],
    ["Are you open to relocating?", "Relocation"],
    ["What roles are you looking for?", "Hiring"],
    ["What's your email?", "Contact"],
  ])("%s → %s", (question, topic) => {
    expect(topicFor(question)).toBe(topic);
  });

  it("returns null when nothing matches, so the professor can say so", () => {
    expect(topicFor("What's your favourite colour?")).toBeNull();
    expect(topicFor("   ")).toBeNull();
  });

  it("ignores case, accents and punctuation", () => {
    expect(topicFor("RÉSUMÉ... EMAIL??")).toBe("Contact");
  });
});
