import type { Tool } from "@/data/registry";

export function formatPlatforms(platforms: string[]) {
  return platforms
    .map((platform) => {
      if (platform === "macos") return "macOS";
      if (platform === "windows") return "Windows";
      if (platform === "linux") return "Linux";
      return platform;
    })
    .join(", ");
}

export function installLabel(type: string) {
  if (type === "brew") return "Homebrew";
  if (type === "npm") return "npm";
  if (type === "cargo") return "Cargo";
  if (type === "uv") return "uv";
  if (type === "pipx") return "pipx";
  if (type === "binary") return "Binary";
  return type;
}

export function installCommand(type: string, pkg?: string) {
  if (!pkg) return null;
  if (type === "brew") return `brew install ${pkg}`;
  if (type === "npm") return `npm install -g ${pkg}`;
  if (type === "cargo") return `cargo install ${pkg}`;
  if (type === "uv") return `uv tool install ${pkg}`;
  if (type === "pipx") return `pipx install ${pkg}`;
  return null;
}

export function toolPageTitle(tool: Tool) {
  return `Install ${tool.display_name} with getcli`;
}

export function toolPageDescription(tool: Tool) {
  return `${toolPageTitle(tool)}. Discover install options, prerequisites, auth notes, verification steps, and examples for ${tool.command}.`;
}

export function relatedTools(currentTool: Tool, allTools: Tool[]) {
  return allTools
    .filter((tool) => tool.id !== currentTool.id)
    .map((tool) => ({
      tool,
      score: tool.tags.filter((tag) => currentTool.tags.includes(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.tool.display_name.localeCompare(b.tool.display_name))
    .slice(0, 4)
    .map(({ tool }) => tool);
}
