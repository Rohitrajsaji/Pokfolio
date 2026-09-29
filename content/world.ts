import type { RoomId, RoomSpec, TownSpec } from "./types";

/**
 * The town and the rooms inside its buildings. Coordinates are tiles from
 * the top-left (0, 0). Dialogue may use {name}, {town}, {partner} and {wild}.
 *
 * The Lab's machines, the Gym's pedestals, and the house's diploma and
 * certificate read their text from projects.ts, experience.ts and profile.ts,
 * so those never go stale.
 */

export const town: TownSpec = {
  ground: [
    "TTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTT",
    "TT....................TT",
    "TT....................TT",
    "TT........+...........TT",
    "TT....................TT",
    "TT....................TT",
    "TT....=..*.*....=.++..TT",
    "TT..=================.TT",
    "TT......==............TT",
    "TT......==............TT",
    "TT......==............TT",
    "TT......==............TT",
    "TT...==============...TT",
    'TT""""""==."""""""""""TT',
    'TT""""""==."""""""""""TT',
    "TTTTTTTT==TTTTTTTTTTTTTT",
    "TTTTTTTT==TTTTTTTTTTTTTT",
  ],
  buildings: [
    { building: "lab", x: 3, y: 2, hint: "PROF. {name}'S LAB · Projects" },
    { building: "gym", x: 13, y: 2, hint: "CAREER GYM · Experience" },
    { building: "house", x: 3, y: 9, hint: "{name}'S HOUSE · About me" },
    { building: "center", x: 10, y: 9, hint: "POKéMON CENTER · Contact" },
    { building: "mart", x: 17, y: 9, hint: "POKé MART · Skills" },
  ],
  props: [
    {
      prop: "sign",
      x: 12,
      y: 7,
      read: {
        lines: [
          "NORTH: PROF. {name}'S LAB (projects) and the CAREER GYM (experience).",
          "SOUTH: {name}'S HOUSE (about), the POKéMON CENTER (contact) and the POKé MART (skills).",
        ],
      },
    },
    {
      prop: "sign",
      x: 10,
      y: 15,
      read: { lines: ["{town}", "Where legacy apps evolve and AI agents are born."] },
    },
    {
      prop: "sign",
      x: 10,
      y: 14,
      read: {
        lines: [
          "CAUTION: a wild {wild} has been spotted in the TALL GRASS!",
          "Walk into the grass to find it, then catch it to add it to your team!",
        ],
      },
    },
    {
      prop: "jobBoard",
      x: 10,
      y: 5,
      read: {
        lines: ["JOB BOARD: {name} is looking for a new challenge!"],
        then: { screen: "jobs" },
      },
    },
    {
      prop: "mailbox",
      x: 2,
      y: 12,
      read: {
        lines: ["It's {name}'s mailbox."],
        confirm: { question: "Send {name} a message?", no: ["You left the mailbox alone."] },
        then: { screen: "contact" },
      },
    },
    { prop: "lamp", x: 2, y: 7 },
    { prop: "lamp", x: 21, y: 7 },
    { prop: "bush", x: 2, y: 9 },
    { prop: "bush", x: 2, y: 10 },
    { prop: "bush", x: 15, y: 12 },
    { prop: "bush", x: 16, y: 12 },
    { prop: "rock", x: 21, y: 11 },
    { prop: "fence", x: 19, y: 13 },
    { prop: "fence", x: 20, y: 13 },
    { prop: "fence", x: 21, y: 13 },
  ],
  npcs: [
    {
      id: "elder",
      look: "elder",
      x: 3,
      y: 13,
      facing: "right",
      talk: {
        lines: [
          "Back in my day, big companies ran everything on AS400 green screens.",
          "Now {name} moves those old apps to Next.js, with AI agents doing the heavy lifting!",
        ],
      },
    },
    {
      id: "lass",
      look: "lass",
      x: 14,
      y: 8,
      facing: "left",
      wander: 2,
      talk: {
        lines: [
          "Have you been to the LAB up north?",
          "Each machine in there holds one of {name}'s projects!",
        ],
      },
    },
    {
      id: "youngster",
      look: "youngster",
      x: 21,
      y: 9,
      facing: "down",
      wander: 1,
      talk: {
        lines: [
          "Tip: press START to open the menu. On a keyboard, that's M or ESC.",
          "In a hurry? The résumé is in there too!",
        ],
      },
    },
  ],
  start: { x: 9, y: 15, facing: "up" },
  edge: [
    "The road leads back to the real world.",
    "Explore {town} first! The résumé is in the START menu.",
  ],
};

export const rooms: Record<RoomId, RoomSpec> = {
  house: {
    name: "{name}'S HOUSE",
    width: 10,
    height: 8,
    floor: "wood",
    wall: "warm",
    furniture: [
      { item: "window", x: 2, y: 0 },
      { item: "diploma", x: 5, y: 0 },
      { item: "certificate", x: 6, y: 0 },
      { item: "window", x: 8, y: 0 },
      {
        item: "tv",
        x: 1,
        y: 2,
        read: { lines: ["{name}'s TRAINER CARD is on TV!"], then: { screen: "card" } },
      },
      {
        item: "bookshelf",
        x: 3,
        y: 2,
        read: {
          lines: ["Books on React, Spring Boot and Python... and a well-worn Pokémon guide."],
        },
      },
      {
        item: "pc",
        x: 8,
        y: 2,
        read: {
          lines: ["It's {name}'s PC. A résumé is open on the screen."],
          confirm: { question: "Read the résumé?", no: ["You logged off."] },
          then: { screen: "resume" },
        },
      },
      {
        item: "bed",
        x: 1,
        y: 4,
        read: { lines: ["{name}'s bed. Looks like {name} fell asleep debugging an agent again."] },
      },
      {
        item: "table",
        x: 4,
        y: 4,
        width: 2,
        read: { lines: ["A notebook full of agent workflow diagrams and TODO lists."] },
      },
      { item: "plant", x: 8, y: 6 },
    ],
    npcs: [],
  },

  lab: {
    name: "PROF. {name}'S LAB",
    width: 12,
    height: 9,
    floor: "tile",
    wall: "cool",
    furniture: [
      { item: "window", x: 1, y: 0 },
      {
        item: "poster",
        x: 6,
        y: 0,
        read: { lines: ["A poster: AGENTS AT WORK. Please do not unplug the lab."] },
      },
      { item: "window", x: 10, y: 0 },
      {
        item: "bookshelf",
        x: 0,
        y: 2,
        read: { lines: ["Research on agent orchestration, retrieval and evals."] },
      },
      {
        item: "bookshelf",
        x: 11,
        y: 2,
        read: { lines: ["Binders labelled VALIDATION, TRACEABILITY and APPROVALS."] },
      },
      { item: "machine", x: 3, y: 2, project: "ai-factory" },
      { item: "machine", x: 5, y: 2, project: "ai-portal" },
      { item: "machine", x: 7, y: 2, project: "mnemo" },
      { item: "machine", x: 9, y: 2, project: "sovereign" },
      {
        item: "table",
        x: 4,
        y: 5,
        width: 2,
        read: { lines: ["Notes on knowledge graphs and reciprocal-rank fusion."] },
      },
      { item: "plant", x: 0, y: 7 },
      { item: "plant", x: 11, y: 7 },
    ],
    npcs: [
      {
        id: "professor",
        name: "PROF. {name}",
        look: "professor",
        x: 9,
        y: 5,
        facing: "left",
        talk: { lines: ["Oh, hello! Welcome to my LAB."], then: { screen: "ask" } },
      },
      {
        id: "aide",
        name: "LAB AIDE",
        look: "aide",
        x: 2,
        y: 6,
        facing: "right",
        talk: {
          lines: [
            "Each machine holds one of PROF. {name}'s projects.",
            "Stand in front of one and press A to read its data!",
          ],
        },
      },
    ],
  },

  center: {
    name: "POKéMON CENTER",
    width: 12,
    height: 9,
    floor: "tile",
    wall: "warm",
    furniture: [
      { item: "window", x: 1, y: 0 },
      { item: "window", x: 10, y: 0 },
      { item: "counter", x: 3, y: 3, width: 6 },
      { item: "healer", x: 3, y: 3 },
      {
        item: "pc",
        x: 10,
        y: 2,
        read: {
          lines: ["It's the CENTER's PC. {name}'s résumé is saved here."],
          confirm: { question: "Open the résumé?", no: ["You logged off."] },
          then: { screen: "resume" },
        },
      },
      { item: "plant", x: 0, y: 2 },
      { item: "plant", x: 11, y: 7 },
      { item: "rug", x: 4, y: 5, width: 4, height: 2 },
    ],
    npcs: [
      {
        id: "nurse",
        name: "NURSE",
        look: "nurse",
        x: 5,
        y: 2,
        facing: "down",
        talk: {
          lines: ["Welcome to the POKéMON CENTER!", "We help trainers get in touch with {name}."],
          confirm: {
            question: "Would you like {name}'s contact details?",
            no: ["We hope to see you again!"],
          },
          then: { screen: "contact" },
        },
      },
    ],
  },

  mart: {
    name: "POKé MART",
    width: 10,
    height: 8,
    floor: "tile",
    wall: "warm",
    furniture: [
      { item: "window", x: 5, y: 0 },
      { item: "counter", x: 1, y: 3, width: 3 },
      {
        item: "shelf",
        x: 6,
        y: 2,
        read: { lines: ["The shelves are packed with TMs."], then: { screen: "bag", shop: true } },
      },
      {
        item: "shelf",
        x: 7,
        y: 2,
        read: { lines: ["The shelves are packed with TMs."], then: { screen: "bag", shop: true } },
      },
      {
        item: "shelf",
        x: 8,
        y: 2,
        read: { lines: ["The shelves are packed with TMs."], then: { screen: "bag", shop: true } },
      },
      { item: "plant", x: 9, y: 6 },
    ],
    npcs: [
      {
        id: "clerk",
        name: "CLERK",
        look: "clerk",
        x: 2,
        y: 2,
        facing: "down",
        talk: {
          lines: ["Welcome to the POKé MART!", "Every TM here teaches one of {name}'s skills."],
          then: { screen: "bag", shop: true },
        },
      },
    ],
  },

  gym: {
    name: "CAREER GYM",
    width: 11,
    height: 10,
    floor: "tile",
    wall: "cool",
    furniture: [
      { item: "window", x: 1, y: 0 },
      { item: "window", x: 9, y: 0 },
      { item: "pedestal", x: 2, y: 3, job: "luminar" },
      { item: "pedestal", x: 5, y: 3, job: "softnotions" },
      { item: "pedestal", x: 8, y: 3, job: "ust" },
      {
        item: "statue",
        x: 3,
        y: 8,
        read: {
          lines: ["CAREER GYM", "LEADER: {name}", "Next challenger: whoever catches {wild}!"],
        },
      },
      {
        item: "statue",
        x: 7,
        y: 8,
        read: {
          lines: ["CAREER GYM", "LEADER: {name}", "Next challenger: whoever catches {wild}!"],
        },
      },
    ],
    npcs: [
      {
        id: "guide",
        name: "GYM GUIDE",
        look: "guide",
        x: 6,
        y: 6,
        facing: "left",
        talk: {
          lines: [
            "Yo! Welcome to the CAREER GYM!",
            "Each pedestal marks a stage of {name}'s career, evolving from left to right!",
          ],
          confirm: {
            question: "Want to watch {name}'s career evolve?",
            no: ["Take a look around, then!"],
          },
          then: { screen: "evolution" },
        },
      },
    ],
  },
};
