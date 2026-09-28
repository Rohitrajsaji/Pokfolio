import type { Job } from "./types";

/** Most recent first. The mascots form an evolution line: Beldum → Metang → Metagross. */
export const experience: Job[] = [
  {
    id: "ust",
    company: "UST",
    role: "Developer I, Software Engineering",
    kind: "full-time",
    start: "2026-03",
    end: "present",
    location: "Chennai, India",
    highlights: [
      "Working on UI modernization of a Fortune 500 retailer's applications from AS400/IBM i to Next.js using custom-built agentic workflows.",
      "Worked on application modernization, requirements interpretation, implementation of agentic workflows, testing, review, and development traceability.",
      "Presented the retail client's modernization approach at an AI workshop held 15–18 September 2026.",
      "Worked with Head of Engineering, Solution Architect, and Lead Engineer stakeholders during hands-on sessions.",
      "Guided participants through project-related development using custom-built agentic workflows and helped engineers create custom agents tailored to their workflows.",
      "Contributed to agent engineering and engineering enablement, including reusable agents, workflow components, validation mechanisms, and structured agent interactions.",
      "Completed Java full-stack training and worked with technologies including Java, Spring Boot, Next.js, relational databases, REST APIs, JWT, testing, and Git-based development workflows.",
    ],
    mascot: { dex: 376, name: "METAGROSS", types: ["steel", "psychic"] },
  },
  {
    id: "softnotions",
    company: "Softnotions Technologies",
    role: "MERN Stack Engineer Intern",
    kind: "internship",
    start: "2025-11",
    end: "2025-12",
    highlights: [
      "Completed a one-month software engineering internship focused on the MERN stack.",
      "Gained hands-on experience building and working with full-stack web application components.",
    ],
    mascot: { dex: 375, name: "METANG", types: ["steel", "psychic"] },
  },
  {
    id: "luminar",
    company: "Luminar Technolab",
    role: "MERN Stack Trainee",
    kind: "training",
    start: "2025-07",
    end: "2025-12",
    highlights: [
      "Trained in React, Node.js, Express, MongoDB, JavaScript, REST APIs, authentication, and deployment concepts.",
      "Developed full-stack applications involving CRUD operations, frontend/backend integration, and API development.",
    ],
    mascot: { dex: 374, name: "BELDUM", types: ["steel", "psychic"] },
  },
];
