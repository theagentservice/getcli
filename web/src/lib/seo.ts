export const siteName = "getcli";
export const siteUrl = "https://getcli.dev";
export const organizationName = "The Agent Service Company";
export const defaultTitle = "getcli";
export const titleTemplate = "%s | getcli";
export const defaultDescription =
  "A unified installer for agent-friendly CLIs. Discover, install, and verify CLI tools through one workflow.";
export const defaultKeywords = [
  "agent cli installer",
  "CLI registry",
  "AI coding agent tools",
  "developer tooling",
  "getcli",
  "CLI install manager",
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
