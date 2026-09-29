"use client";

import { professorQa } from "@content";
import type { ScreenRequest } from "@content/types";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { input } from "../../engine/input";
import { matchQuestion, type Topic } from "../../qa";
import { useGame } from "../../state/store";
import { fill } from "../../text";
import { ScreenFrame } from "../ScreenFrame";
import { MessageBox, SCREEN_LINKS } from "./parts";

interface Reply {
  lines: string[];
  /** The screen with the details, offered as a button under the answer. */
  then?: ScreenRequest;
}

function replyTo(topic: Topic | null): Reply {
  if (!topic) return { lines: professorQa.fallback.map(fill) };
  return { lines: topic.answer.map(fill), then: topic.then };
}

/** Up and down leave the text field, so the D-pad cursor never gets stuck in it. */
function leaveWithArrows(event: KeyboardEvent<HTMLInputElement>) {
  const direction = event.key === "ArrowUp" ? "up" : event.key === "ArrowDown" ? "down" : null;
  if (!direction) return;
  event.preventDefault();
  input.press(direction);
  input.release(direction);
}

/** PROF. ROHIT answers questions: pick a topic, or type one. */
export function AskScreen() {
  const [reply, setReply] = useState<Reply>(() => ({ lines: professorQa.greeting.map(fill) }));
  const [question, setQuestion] = useState("");
  const followUp = useRef<HTMLButtonElement>(null);
  const inputId = useId();

  // An answer that leads somewhere puts the cursor on the way there.
  useEffect(() => {
    followUp.current?.focus();
  }, [reply]);

  const ask = (event: FormEvent) => {
    event.preventDefault();
    if (question.trim()) setReply(replyTo(matchQuestion(professorQa, question)));
  };

  const { then } = reply;
  return (
    <ScreenFrame title="ASK THE PROFESSOR" accent="#5a6bc4">
      <MessageBox speaker={fill("PROF. {name}")} lines={reply.lines}>
        {then && (
          <div className="screen-actions">
            <button
              ref={followUp}
              type="button"
              data-nav
              className="screen-button"
              onClick={() => useGame.getState().pushScreen(then)}
            >
              {SCREEN_LINKS[then.screen]}
            </button>
          </div>
        )}
      </MessageBox>
      <div className="topics" role="group" aria-label="Topics">
        {professorQa.topics.map((topic) => (
          <button
            key={topic.label}
            type="button"
            data-nav
            className="topic"
            onClick={() => setReply(replyTo(topic))}
          >
            {topic.label}
          </button>
        ))}
      </div>
      <form className="ask-form" onSubmit={ask}>
        <label htmlFor={inputId} className="sr-only">
          Ask your own question
        </label>
        <input
          id={inputId}
          data-nav
          className="ask-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={leaveWithArrows}
          placeholder="Or type your own question..."
          maxLength={160}
          autoComplete="off"
        />
        <button type="submit" data-nav className="screen-button">
          ASK
        </button>
      </form>
    </ScreenFrame>
  );
}
