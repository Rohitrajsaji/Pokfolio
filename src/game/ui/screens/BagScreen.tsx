"use client";

import { dialogue, skills } from "@content";
import { useId, useState, type CSSProperties } from "react";
import { TYPE_COLORS } from "@/art/palette";
import { itemSpriteUrl } from "@/pokeapi/sprites";
import { Sprite } from "@/ui/Sprite";
import { useGame } from "../../state/store";
import { fill, fillWith } from "../../text";
import { ScreenFrame } from "../ScreenFrame";
import { MessageBox, SCREEN_LINKS } from "./parts";

/** TM numbers run on from pocket to pocket: the very first skill is TM01. */
const FIRST_TM = skills.map((_, i) =>
  skills.slice(0, i).reduce((count, category) => count + category.skills.length, 1),
);

export const tmNumber = (pocket: number, item: number) =>
  `TM${String(FIRST_TM[pocket] + item).padStart(2, "0")}`;

/**
 * The BAG, or the POKé MART's shelves when `shop` is set: one pocket per
 * skill category, one TM per skill.
 */
export function BagScreen({ shop = false }: { shop?: boolean }) {
  const [pocket, setPocket] = useState(0);
  const [lines, setLines] = useState(() => (shop ? [fill(dialogue.shop.greeting)] : []));
  const [refused, setRefused] = useState(false);
  const id = useId();
  const category = skills[pocket];
  const icon = (type: string) => itemSpriteUrl(`tm-${type}`);
  const open = (screen: "contact" | "jobs") => useGame.getState().pushScreen({ screen });

  const tryToBuy = (item: string) => {
    setLines(dialogue.shop.refusal.map((line) => fillWith(line, { item })));
    setRefused(true);
  };

  return (
    <ScreenFrame
      title={shop ? "POKé MART" : "BAG"}
      accent={shop ? "#3a78c8" : "#c27a2c"}
      onSelect={(item) => {
        if (item.dataset.pocket) setPocket(Number(item.dataset.pocket));
      }}
    >
      <div className="pockets" role="tablist" aria-label="Skill categories">
        {skills.map((entry, i) => (
          <button
            key={entry.id}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === pocket}
            aria-controls={`${id}-panel`}
            data-nav
            data-pocket={i}
            className="pocket"
            style={{ "--type": TYPE_COLORS[entry.type] } as CSSProperties}
            onClick={() => setPocket(i)}
          >
            <Sprite src={icon(entry.type)} alt="" size={24} className="pocket-icon" />
            {entry.name}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${pocket}`}
        className="pocket-panel"
      >
        <ul className="tm-list">
          {category.skills.map((skill, i) => {
            const label = (
              <>
                <Sprite src={icon(category.type)} alt="" size={24} className="tm-icon" />
                <span className="tm-no">{tmNumber(pocket, i)}</span>
                <span className="tm-name">{skill}</span>
                {shop && <span className="tm-price">PRICELESS</span>}
              </>
            );
            return (
              <li key={skill}>
                {shop ? (
                  <button
                    type="button"
                    data-nav
                    className="tm-item"
                    onClick={() => tryToBuy(`${tmNumber(pocket, i)} ${skill.toUpperCase()}`)}
                  >
                    {label}
                  </button>
                ) : (
                  <span className="tm-item">{label}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {shop && (
        <MessageBox speaker="CLERK" lines={lines}>
          {refused && (
            <div className="screen-actions">
              <button
                type="button"
                data-nav
                className="screen-button"
                onClick={() => open("contact")}
              >
                ▶ {SCREEN_LINKS.contact}
              </button>
              <button type="button" data-nav className="screen-button" onClick={() => open("jobs")}>
                ▶ {SCREEN_LINKS.jobs}
              </button>
            </div>
          )}
        </MessageBox>
      )}
    </ScreenFrame>
  );
}
