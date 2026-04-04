const helpFlagMatcher = /(^|\s)--help(\s|$|[=,])/;
const versionFlagMatcher = /(^|\s)--version(\s|$|[=,])/;
const jsonFlagMatchers = [
  /(^|\s)--json(\s|$|[=,])/,
  /--format(?:\s|=)+json(?:\s|$|[,.)\]])/,
];
const yesFlagMatcher = /(^|\s)--yes(\s|$|[=,])/;
const dryRunFlagMatcher = /(^|\s)--dry-run(\s|$|[=,])/;

const defaultSpec = {
  help: {
    kind: "exit_code",
    args: ["--help"],
    expectedLabel: "--help",
  },
  version: {
    kind: "exit_code",
    args: ["--version"],
    expectedLabel: "--version",
  },
  json: {
    kind: "help_text",
    args: ["--help"],
    expectedLabel: "--json or --format json",
    matchers: jsonFlagMatchers,
  },
  yes: {
    kind: "help_text",
    args: ["--help"],
    expectedLabel: "--yes",
    matchers: [yesFlagMatcher],
  },
  dry_run: {
    kind: "help_text",
    args: ["--help"],
    expectedLabel: "--dry-run",
    matchers: [dryRunFlagMatcher],
  },
  schema: {
    kind: "exit_code",
    args: ["schema", "--help"],
    expectedLabel: "schema",
  },
};

const toolOverrides = {
  github: {
    json: {
      kind: "help_text",
      args: ["repo", "list", "--help"],
      expectedLabel: "--json",
      matchers: [/^\s*--json(?:\s|$|[=,])/m],
    },
    yes: {
      kind: "help_text",
      args: ["repo", "delete", "--help"],
      expectedLabel: "--yes",
      matchers: [yesFlagMatcher],
    },
  },
  "google-workspace": {
    json: {
      kind: "help_text",
      args: ["sheets", "spreadsheets", "create", "--help"],
      expectedLabel: "--json",
      matchers: [/^\s*--json(?:\s|$|[=,])/m],
    },
  },
  wrangler: {
    dry_run: {
      kind: "help_text",
      args: ["deploy", "--help"],
      expectedLabel: "--dry-run",
      matchers: [dryRunFlagMatcher],
    },
  },
};

export function getVerificationSpec(toolId) {
  const overrides = toolOverrides[toolId] ?? {};

  return {
    help: { ...defaultSpec.help, ...(overrides.help ?? {}) },
    version: { ...defaultSpec.version, ...(overrides.version ?? {}) },
    json: { ...defaultSpec.json, ...(overrides.json ?? {}) },
    yes: { ...defaultSpec.yes, ...(overrides.yes ?? {}) },
    dry_run: { ...defaultSpec.dry_run, ...(overrides.dry_run ?? {}) },
    schema: { ...defaultSpec.schema, ...(overrides.schema ?? {}) },
  };
}

export const verificationDefaults = {
  helpFlagMatcher,
  versionFlagMatcher,
  jsonFlagMatchers,
  yesFlagMatcher,
  dryRunFlagMatcher,
};
