import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { getVerificationSpec } from "../verification/specs.mjs";

const repoRoot = process.cwd();
const toolId = process.argv[2];

if (!toolId) {
  console.error("Usage: node scripts/verify-tool.mjs <tool-id>");
  process.exit(1);
}

const getcliBin = process.env.GETCLI_BIN?.trim()
  || path.join(repoRoot, "cli", "target", "release", process.platform === "win32" ? "getcli.exe" : "getcli");
const artifactDir = path.join(repoRoot, ".artifacts", "tool-verification");

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
  const candidates = [];
  const stdout = result.stdout.trim();
  const combined = `${result.stdout}\n${result.stderr}`
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (stdout) {
    candidates.push(stdout);
  }

  for (const line of combined.reverse()) {
    if (line.startsWith("{") || line.startsWith("[")) {
      candidates.push(line);
    }
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }

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

function probeStatus(observed, fallback = "not_supported") {
  return observed ? "supported" : fallback;
}

function formatCommand(command, args) {
  return [command, ...args];
}

function normalizedText(result) {
  return `${result.stdout}\n${result.stderr}`.toLowerCase();
}

function runCheck(command, spec) {
  const step = runCommand(command, spec.args);
  const invoked = formatCommand(command, spec.args);

  if (spec.kind === "exit_code") {
    return {
      status: probeStatus(step.status === 0),
      command: invoked,
      evidence: `exit code ${step.status}`,
    };
  }

  const helpText = normalizedText(step);
  const observed = spec.matchers.some((matcher) => matcher.test(helpText));

  return {
    status: probeStatus(observed),
    command: invoked,
    evidence: observed
      ? `${spec.expectedLabel} was observed in help output`
      : `${spec.expectedLabel} was not observed in help output`,
  };
}

function writeSummary(markdown) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8");
}

function writeArtifact(summary) {
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(path.join(artifactDir, `${toolId}.json`), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

function errorChecks(command) {
  const verificationSpec = getVerificationSpec(toolId);

  return {
    help: {
      status: "error",
      command: formatCommand(command, verificationSpec.help.args),
      evidence: "Verification failed before this check completed",
    },
    version: {
      status: "error",
      command: formatCommand(command, verificationSpec.version.args),
      evidence: "Verification failed before this check completed",
    },
    json: {
      status: "error",
      command: formatCommand(command, verificationSpec.json.args),
      evidence: "Verification failed before this check completed",
    },
    yes: {
      status: "error",
      command: formatCommand(command, verificationSpec.yes.args),
      evidence: "Verification failed before this check completed",
    },
    dry_run: {
      status: "error",
      command: formatCommand(command, verificationSpec.dry_run.args),
      evidence: "Verification failed before this check completed",
    },
    schema: {
      status: "error",
      command: formatCommand(command, verificationSpec.schema.args),
      evidence: "Verification failed before this check completed",
    },
  };
}

function writeFailureSummary({ stage, error, manifest, installMethod, installStatus }) {
  const summary = {
    tool_id: toolId,
    verified_at: new Date().toISOString(),
    runner_os: process.env.RUNNER_OS || process.platform,
    install_method: installMethod ?? "",
    install_status: installStatus ?? "error",
    doctor_passed: false,
    failure_stage: stage,
    failure_message: error instanceof Error ? error.message : String(error),
    checks: errorChecks(manifest?.command ?? toolId),
  };

  writeArtifact(summary);
  writeSummary(`## Tool Verification: \`${toolId}\``);
  writeSummary(`- Failure stage: \`${stage}\``);
  writeSummary(`- Failure message: \`${summary.failure_message}\``);
  console.log(JSON.stringify(summary, null, 2));
}

let currentStage = "info";
let manifest;
let selectedMethod = "";
let installStatus = "error";

try {
  const infoStep = maybeRunJson(getcliBin, ["info", toolId, "--json"], "info");
  manifest = infoStep.data;

  currentStage = "pre-install doctor";
  const preDoctorStep = maybeRunJson(getcliBin, ["doctor", toolId, "--json"], "pre-install doctor");
  const preDoctor = preDoctorStep.data;

  const supportedAvailableInstallers = (preDoctor.installers ?? [])
    .filter((installer) => installer.supported_by_tool && installer.available)
    .map((installer) => installer.name);

  const defaultMethod = manifest.install?.default?.type;
  selectedMethod = supportedAvailableInstallers.includes(defaultMethod)
    ? defaultMethod
    : supportedAvailableInstallers[0];

  if (!selectedMethod) {
    throw new Error(`No supported installer is available for ${toolId}`);
  }

  const installArgs = ["install", toolId, "--yes", "--json"];
  if (selectedMethod !== defaultMethod) {
    installArgs.push("--method", selectedMethod);
  }

  currentStage = "install";
  const installStep = maybeRunJson(getcliBin, installArgs, "install");
  const installResult = installStep.data;
  installStatus = installResult.status ?? "unknown";

  currentStage = "post-install doctor";
  const postDoctorStep = maybeRunJson(getcliBin, ["doctor", toolId, "--json"], "post-install doctor");
  const postDoctor = postDoctorStep.data;

  currentStage = "checklist probes";
  const verificationSpec = getVerificationSpec(toolId);
  const checks = {
    help: runCheck(manifest.command, verificationSpec.help),
    version: runCheck(manifest.command, verificationSpec.version),
    json: runCheck(manifest.command, verificationSpec.json),
    yes: runCheck(manifest.command, verificationSpec.yes),
    dry_run: runCheck(manifest.command, verificationSpec.dry_run),
    schema: runCheck(manifest.command, verificationSpec.schema),
  };

  const summary = {
    tool_id: toolId,
    verified_at: new Date().toISOString(),
    runner_os: process.env.RUNNER_OS || process.platform,
    install_method: selectedMethod,
    install_status: installStatus,
    doctor_passed: Boolean(postDoctor.passed),
    checks,
  };

  writeArtifact(summary);

  writeSummary(`## Tool Verification: \`${toolId}\``);
  writeSummary(`- Runner command: \`${manifest.command}\``);
  writeSummary(`- Install method used: \`${selectedMethod}\``);
  writeSummary(`- Install result: \`${installStatus}\``);
  writeSummary(`- Doctor passed: \`${postDoctor.passed ? "yes" : "no"}\``);
  writeSummary("");
  writeSummary("| Check | Result |");
  writeSummary("| --- | --- |");
  writeSummary(`| \`getcli install\` | ${installStatus} |`);
  writeSummary(`| \`getcli doctor\` | ${postDoctor.passed ? "pass" : "fail"} |`);
  writeSummary(`| \`${checks.version.command.join(" ")}\` | ${checks.version.status} |`);
  writeSummary(`| \`${checks.help.command.join(" ")}\` | ${checks.help.status} |`);
  writeSummary(`| \`${checks.json.command.join(" ")}\` | ${checks.json.status} |`);
  writeSummary(`| \`${checks.yes.command.join(" ")}\` | ${checks.yes.status} |`);
  writeSummary(`| \`${checks.dry_run.command.join(" ")}\` | ${checks.dry_run.status} |`);
  writeSummary(`| \`${checks.schema.command.join(" ")}\` | ${checks.schema.status} |`);

  console.log(JSON.stringify(summary, null, 2));

  const hasCriticalFailure =
    !postDoctor.passed
    || checks.help.status !== "supported"
    || checks.version.status !== "supported"
    || !["installed", "already_installed"].includes(installStatus);

  if (hasCriticalFailure) {
    process.exit(1);
  }
} catch (error) {
  writeFailureSummary({
    stage: currentStage,
    error,
    manifest,
    installMethod: selectedMethod,
    installStatus,
  });
  process.exit(1);
}
