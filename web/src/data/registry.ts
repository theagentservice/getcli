export interface Tool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  command: string;
  homepage?: string;
  platforms: string[];
  agent_friendly: boolean;
  supports_json: boolean;
  install_default: string;
  tags: string[];
  examples: string[];
}

export { allTags, tools } from "./registry.generated";
