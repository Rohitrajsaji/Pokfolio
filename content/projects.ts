import type { Project } from "./types";

/**
 * Each project gets a machine in Prof. Rohit's Lab and a Pokédex page.
 * To add one, copy an entry, give it a new `id`, and pick a mascot.
 */
export const projects: Project[] = [
  {
    id: "ai-factory",
    name: "AI Factory",
    tagline: "AI-Assisted Engineering & Agent Workflows",
    summary:
      "Worked on hardening and using an AI-assisted engineering framework for structured software-development workflows. Used the framework as part of the retail modernization workflow and engineering enablement sessions.",
    highlightsTitle: "Focus areas",
    highlights: [
      "Agent and sub-agent orchestration",
      "Reusable agents, commands, skills, rules, and templates",
      "Scoped agent responsibilities and separation of duties",
      "Validation and artifact-quality checks",
      "Approval-aware engineering workflows",
      "Traceability and evidence-based development",
      "Custom-agent enablement for engineering teams",
    ],
    tags: ["Agent orchestration", "Workflow governance", "Validation"],
    mascot: { dex: 601, name: "KLINKLANG", types: ["steel"] },
  },
  {
    id: "ai-portal",
    name: "AI Portal",
    tagline: "Six-Module AI Application Portal",
    summary:
      "Worked on an AI application portal that combines a Next.js frontend with a Flask backend, modular service routes, frontend API integration, and AI-oriented application workflows.",
    highlightsTitle: "Modules",
    highlights: [
      "Model Arena",
      "Tutor",
      "Translator",
      "Voice Document Generator",
      "Whiteboard Cam",
      "Sketch-to-UI",
    ],
    tags: ["Next.js", "React", "TypeScript", "Python", "Flask"],
    mascot: { dex: 474, name: "PORYGON-Z", types: ["normal"] },
  },
  {
    id: "mnemo",
    name: "Mnemo",
    tagline: "Knowledge Management & Retrieval",
    status: "Prototype",
    summary:
      "Worked on an organizational knowledge-management prototype designed to turn scattered information into structured, connected knowledge.",
    highlightsTitle: "Capabilities",
    highlights: [
      "Interactive knowledge graph",
      "Relationship provenance",
      "Knowledge updates and organization",
      "Graph-aware information retrieval",
      "Bounded graph expansion",
      "Reciprocal-rank fusion",
      "Citation-oriented answer generation",
    ],
    tags: ["React", "TypeScript", "Knowledge Graphs", "Retrieval"],
    mascot: { dex: 480, name: "UXIE", types: ["psychic"] },
  },
  {
    id: "sovereign",
    name: "Sovereign",
    tagline: "Local AI Engineering System",
    status: "Ongoing",
    summary:
      "Developing a local-first AI engineering system focused on governed agent execution and local model integration.",
    highlightsTitle: "Concepts",
    highlights: [
      "Local LLM integration",
      "Controller-governed agent execution",
      "Permission boundaries",
      "Approval and audit mechanisms",
      "Recovery and deterministic execution",
      "SQLite-backed state",
      "Tool and process isolation",
      "Verification-driven software development",
    ],
    tags: ["Local LLMs", "Agent governance", "SQLite"],
    mascot: { dex: 623, name: "GOLURK", types: ["ground", "ghost"] },
  },
];
