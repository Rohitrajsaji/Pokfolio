import type { SkillCategory } from "./types";

/** Sold as TMs in the Poké Mart. `type` sets the TM colour and the Rotom form in battle. */
export const skills: SkillCategory[] = [
  {
    id: "ai-agents",
    name: "AI & Agent Engineering",
    type: "ghost",
    skills: [
      "AI-assisted development",
      "Agent/sub-agent workflows",
      "Custom agents",
      "Tool orchestration",
      "Agent contracts",
      "Workflow governance",
      "Validation pipelines",
      "Local LLM integration",
      "Retrieval systems",
    ],
  },
  {
    id: "frontend",
    name: "Frontend",
    type: "water",
    skills: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "HTML", "CSS", "Vite"],
  },
  {
    id: "backend",
    name: "Backend",
    type: "fire",
    skills: ["Java", "Spring Boot", "Node.js", "Express", "Python", "Flask", "REST APIs"],
  },
  {
    id: "databases",
    name: "Databases",
    type: "ice",
    skills: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
  },
  {
    id: "engineering",
    name: "Engineering",
    type: "grass",
    skills: [
      "Git",
      "GitHub",
      "Debugging",
      "Testing",
      "Code review",
      "Technical documentation",
      "Workflow design",
      "Engineering enablement",
    ],
  },
  {
    id: "cloud",
    name: "Cloud & Deployment",
    type: "flying",
    skills: ["AWS EC2", "Nginx", "PM2", "GitHub Actions"],
  },
];
