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
  return `${toolPageTitle(tool)}. Learn how to install ${tool.display_name} on ${formatPlatforms(tool.platforms)}, verify ${tool.command}, review prerequisites, and compare install channels.`;
}

export function toolPageKeywords(tool: Tool) {
  const keywords = new Set<string>([
    `${tool.display_name} install`,
    `${tool.command} install`,
    `${tool.display_name} CLI`,
    `${tool.display_name} download`,
    `install ${tool.display_name}`,
    `install ${tool.command}`,
    ...tool.tags,
    "getcli",
  ]);

  for (const alias of tool.aliases) {
    keywords.add(`${alias} install`);
    keywords.add(`${alias} CLI`);
  }

  for (const platform of tool.platforms) {
    const label = platform === "macos" ? "mac" : platform;
    keywords.add(`${tool.display_name} ${label}`);
    keywords.add(`install ${tool.display_name} on ${label}`);
  }

  return Array.from(keywords);
}

export function toolPlatformInstallCopy(tool: Tool) {
  return `This guide covers installing ${tool.display_name} on ${formatPlatforms(tool.platforms)} and verifying that \`${tool.command}\` is ready for real automation work.`;
}

export function toolChannelSummary(tool: Tool) {
  const channel = installLabel(tool.install_default);
  const pkg = tool.install_default_package ? ` using package \`${tool.install_default_package}\`` : "";

  return `${tool.display_name} defaults to ${channel}${pkg}, but getcli keeps the install and verification flow consistent even when teams mix package managers across machines.`;
}

export function toolVerificationCopy(tool: Tool) {
  return `After install, verify ${tool.display_name} with \`getcli doctor ${tool.id}\` before you rely on \`${tool.command}\` inside CI, scripts, or agent workflows.`;
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
