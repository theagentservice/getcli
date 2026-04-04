import { tools, type Tool } from "@/data/registry";

export type AgentDimensionId =
  | "structured_output"
  | "dry_run"
  | "non_interactive"
  | "help_surface"
  | "agent_skills"
  | "headless_auth";

export type AgentCapabilityStatus = "yes" | "partial" | "no";

export interface AgentDimension {
  id: AgentDimensionId;
  label: string;
  description: string;
}

export interface ToolAgentCapabilities {
  structured_output: AgentCapabilityStatus;
  dry_run: AgentCapabilityStatus;
  non_interactive: AgentCapabilityStatus;
  help_surface: AgentCapabilityStatus;
  agent_skills: AgentCapabilityStatus;
  headless_auth: AgentCapabilityStatus;
}

export const agentDimensions: AgentDimension[] = [
  {
    id: "headless_auth",
    label: "Headless Auth",
    description: "Can agents operate it in CI or remote automation without a human-only login loop?",
  },
  {
    id: "non_interactive",
    label: "No REPL",
    description: "Is the CLI fundamentally scriptable, flag-driven, and usable without dropping into an interactive shell?",
  },
  {
    id: "structured_output",
    label: "JSON --json",
    description: "Can an agent reliably get structured machine-readable output instead of scraping text?",
  },
  {
    id: "dry_run",
    label: "Dry Run --dry-run",
    description: "Can the CLI preview side effects before it mutates state or sends a request?",
  },
  {
    id: "help_surface",
    label: "Help --help",
    description: "Does the tool have a discoverable command surface with useful help output and stable subcommands?",
  },
  {
    id: "agent_skills",
    label: "Skill --skill",
    description: "Does the project ship agent skills, extensions, or other first-party AI-oriented integration points?",
  },
];

const toolCapabilityOverrides: Record<string, Partial<ToolAgentCapabilities>> = {
  aws: {
    structured_output: "yes",
    dry_run: "partial",
    non_interactive: "yes",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "yes",
  },
  docker: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "yes",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  feishu: {
    structured_output: "yes",
    dry_run: "yes",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "yes",
    headless_auth: "partial",
  },
  firebase: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  fly: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "yes",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  github: {
    structured_output: "yes",
    dry_run: "no",
    non_interactive: "yes",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "yes",
  },
  "google-workspace": {
    structured_output: "yes",
    dry_run: "yes",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "yes",
    headless_auth: "yes",
  },
  kubectl: {
    structured_output: "yes",
    dry_run: "no",
    non_interactive: "yes",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  netlify: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  railway: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  stripe: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  supabase: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  terraform: {
    structured_output: "partial",
    dry_run: "yes",
    non_interactive: "yes",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  turso: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  },
  vercel: {
    structured_output: "partial",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "partial",
    headless_auth: "yes",
  },
  wrangler: {
    structured_output: "no",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "partial",
    headless_auth: "yes",
  },
};

function defaultCapabilities(tool: Tool): ToolAgentCapabilities {
  return {
    structured_output: tool.supports_json ? "yes" : "no",
    dry_run: "no",
    non_interactive: "partial",
    help_surface: "yes",
    agent_skills: "no",
    headless_auth: "partial",
  };
}

export function getToolAgentCapabilities(tool: Tool): ToolAgentCapabilities {
  return {
    ...defaultCapabilities(tool),
    ...toolCapabilityOverrides[tool.id],
  };
}

export function capabilityLabel(status: AgentCapabilityStatus) {
  if (status === "yes") return "Supported";
  if (status === "partial") return "Partial";
  return "No";
}

export function capabilityClassName(status: AgentCapabilityStatus) {
  if (status === "yes") return "bg-green-100 text-green-800";
  if (status === "partial") return "bg-amber-100 text-amber-800";
  return "bg-gray-200 text-gray-700";
}

function capabilityWeight(status: AgentCapabilityStatus) {
  if (status === "yes") return 2;
  if (status === "partial") return 1;
  return 0;
}

function averageCapabilityScore(capabilities: ToolAgentCapabilities) {
  const values = Object.values(capabilities);
  return values.reduce((sum, value) => sum + capabilityWeight(value), 0) / values.length;
}

export const agentFriendlyTools = tools
  .map((tool) => {
    const capabilities = getToolAgentCapabilities(tool);

    return {
      tool,
      capabilities,
      average: averageCapabilityScore(capabilities),
    };
  })
  .sort((a, b) => b.average - a.average || a.tool.display_name.localeCompare(b.tool.display_name));
