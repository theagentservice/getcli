export interface InstallMethod {
  type: string;
  package?: string;
  url?: string;
  note?: string;
}

export interface Tool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  command: string;
  homepage?: string;
  aliases: string[];
  platforms: string[];
  agent_friendly: boolean;
  supports_json: boolean;
  recommended_version?: string;
  install_default: string;
  install_default_package?: string;
  install_alternatives: InstallMethod[];
  prerequisites: string[];
  auth_notes: string[];
  tags: string[];
  examples: string[];
}

import { allTags, tools } from "./registry.generated";

export { allTags, tools };

export function getToolById(id: string) {
  return tools.find((tool) => tool.id === id);
}
