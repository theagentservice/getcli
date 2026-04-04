import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const toolId = process.argv[2];
const sourcePath = process.argv[3]
  ? path.resolve(repoRoot, process.argv[3])
  : path.join(repoRoot, ".artifacts", "tool-verification", `${toolId}.json`);

if (!toolId) {
  console.error("Usage: node scripts/promote-tool-verification.mjs <tool-id> [source-path]");
  process.exit(1);
}

const requiredChecks = ["help", "version", "json", "yes", "dry_run", "schema"];
const result = JSON.parse(readFileSync(sourcePath, "utf8"));

if (result.tool_id !== toolId) {
  console.error(`Verification result tool_id mismatch: expected ${toolId}, got ${result.tool_id}`);
  process.exit(1);
}

for (const checkId of requiredChecks) {
  if (!result.checks?.[checkId]?.status) {
    console.error(`Verification result is missing checks.${checkId}.status`);
    process.exit(1);
  }
}

const resultsDir = path.join(repoRoot, "verification", "results");
const destinationPath = path.join(resultsDir, `${toolId}.json`);
mkdirSync(resultsDir, { recursive: true });
writeFileSync(destinationPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

const generateResult = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "generate-tool-verification.mjs")], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (generateResult.status !== 0) {
  process.exit(generateResult.status ?? 1);
}

console.log(`Promoted verification result to ${destinationPath}`);
