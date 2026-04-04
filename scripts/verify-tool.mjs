import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const toolId = process.argv[2];

if (!toolId) {
  console.error("Usage: node scripts/verify-tool.mjs <tool-id>");
  process.exit(1);
}

const getcliBin = process.env.GETCLI_BIN?.trim()
  || path.join(repoRoot, "cli", "target", "release", process.platform === "win32" ? "getcli.exe" : "getcli");

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    ...options,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  return {
    command,
    args,
    status: result.status ?? 1,
    stdout,
    stderr,
    combined: `${stdout}\n${stderr}`.trim(),
  };
}

function parseJsonResult(result, label) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    console.error(`Failed to parse JSON for ${label}`);
    console.error(result.stdout);
    console.error(result.stderr);
    throw error;
  }
}

function maybeRunJson(command, args, label) {
  const result = runCommand(command, args);
  const data = parseJsonResult(result, label);
  return { result, data };
}

function normalizeFlagProbe(value) {
  return value ? "observed" : "not_observed";
}

function writeSummary(markdown) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8");
}

const infoStep = maybeRunJson(getcliBin, ["info", toolId, "--json"], "info");
const manifest = infoStep.data;

const preDoctorStep = maybeRunJson(getcliBin, ["doctor", toolId, "--json"], "pre-install doctor");
const preDoctor = preDoctorStep.data;

const supportedAvailableInstallers = (preDoctor.installers ?? [])
  .filter((installer) => installer.supported_by_tool && installer.available)
  .map((installer) => installer.name);

const defaultMethod = manifest.install?.default?.type;
const selectedMethod = supportedAvailableInstallers.includes(defaultMethod)
  ? defaultMethod
  : supportedAvailableInstallers[0];

if (!selectedMethod) {
  console.error(`No supported installer is available for ${toolId}`);
  process.exit(1);
}

const installArgs = ["install", toolId, "--yes", "--json"];
if (selectedMethod !== defaultMethod) {
  installArgs.push("--method", selectedMethod);
}

const installStep = maybeRunJson(getcliBin, installArgs, "install");
const installResult = installStep.data;

const postDoctorStep = maybeRunJson(getcliBin, ["doctor", toolId, "--json"], "post-install doctor");
const postDoctor = postDoctorStep.data;

const versionStep = runCommand(manifest.command, ["--version"]);
const helpStep = runCommand(manifest.command, ["--help"]);
const schemaStep = runCommand(manifest.command, ["schema", "--help"]);

const helpText = `${helpStep.stdout}\n${helpStep.stderr}`.toLowerCase();

const probes = {
  help: helpStep.status === 0,
  version: versionStep.status === 0,
  json_flag: /(^|\s)--json(\s|$|[=,])|--format(\s|$|[=,])/.test(helpText),
  yes_flag: /(^|\s)--yes(\s|$|[=,])/.test(helpText),
  dry_run_flag: /(^|\s)--dry-run(\s|$|[=,])/.test(helpText),
  schema_command: schemaStep.status === 0 || /\bschema\b/.test(helpText),
};

const summary = {
  tool_id: toolId,
  command: manifest.command,
  selected_method: selectedMethod,
  install_status: installResult.status ?? "unknown",
  install_result: installResult,
  doctor_passed: Boolean(postDoctor.passed),
  doctor_issues: postDoctor.issues ?? [],
  probes: {
    help: normalizeFlagProbe(probes.help),
    version: normalizeFlagProbe(probes.version),
    json_flag: normalizeFlagProbe(probes.json_flag),
    yes_flag: normalizeFlagProbe(probes.yes_flag),
    dry_run_flag: normalizeFlagProbe(probes.dry_run_flag),
    schema_command: normalizeFlagProbe(probes.schema_command),
  },
  command_checks: {
    version_exit_code: versionStep.status,
    help_exit_code: helpStep.status,
    schema_exit_code: schemaStep.status,
  },
};

const artifactDir = path.join(repoRoot, ".artifacts", "tool-verification");
mkdirSync(artifactDir, { recursive: true });
writeFileSync(path.join(artifactDir, `${toolId}.json`), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

writeSummary(`## Tool Verification: \`${toolId}\``);
writeSummary(`- Runner command: \`${manifest.command}\``);
writeSummary(`- Install method used: \`${selectedMethod}\``);
writeSummary(`- Install result: \`${installResult.status ?? "unknown"}\``);
writeSummary(`- Doctor passed: \`${postDoctor.passed ? "yes" : "no"}\``);
writeSummary("");
writeSummary("| Check | Result |");
writeSummary("| --- | --- |");
writeSummary(`| \`getcli install\` | ${installResult.status ?? "unknown"} |`);
writeSummary(`| \`getcli doctor\` | ${postDoctor.passed ? "pass" : "fail"} |`);
writeSummary(`| \`${manifest.command} --version\` | ${probes.version ? "pass" : "fail"} |`);
writeSummary(`| \`${manifest.command} --help\` | ${probes.help ? "pass" : "fail"} |`);
writeSummary(`| JSON flag probe | ${summary.probes.json_flag} |`);
writeSummary(`| --yes probe | ${summary.probes.yes_flag} |`);
writeSummary(`| --dry-run probe | ${summary.probes.dry_run_flag} |`);
writeSummary(`| schema probe | ${summary.probes.schema_command} |`);

console.log(JSON.stringify(summary, null, 2));

const hasCriticalFailure =
  !postDoctor.passed
  || !probes.help
  || !probes.version
  || !["installed", "already_installed"].includes(installResult.status ?? "");

if (hasCriticalFailure) {
  process.exit(1);
}
