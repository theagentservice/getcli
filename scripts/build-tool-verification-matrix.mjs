import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestsDir = path.join(repoRoot, "manifests");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function manifestPathFromId(toolId) {
  return path.join(manifestsDir, `${toolId}.yaml`);
}

function parseManifest(filePath) {
  const source = readFileSync(filePath, "utf8");
  const id = source.match(/^id:\s*(.+)$/m)?.[1]?.trim();
  const defaultType = source.match(/^    type:\s*(.+)$/m)?.[1]?.trim();

  if (!id) {
    fail(`Missing id in ${filePath}`);
  }

  if (!defaultType) {
    fail(`Missing install.default.type in ${filePath}`);
  }

  return {
    tool_id: id,
    os: defaultType === "brew" ? "macos-latest" : "ubuntu-latest",
  };
}

function changedManifestPaths(base, head) {
  if (!base || !head) {
    return [];
  }

  const output = execFileSync("git", ["diff", "--name-only", base, head, "--", "manifests"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("manifests/") && line.endsWith(".yaml"));
}

function uniqueRecords(records) {
  const byId = new Map();

  for (const record of records) {
    byId.set(record.tool_id, record);
  }

  return Array.from(byId.values()).sort((a, b) => a.tool_id.localeCompare(b.tool_id));
}

function resolveRecords() {
  const manualToolId = process.env.TOOL_ID?.trim() || process.env.INPUT_TOOL_ID?.trim();

  if (manualToolId) {
    const filePath = manifestPathFromId(manualToolId);

    if (!existsSync(filePath)) {
      fail(`Unknown tool id: ${manualToolId}`);
    }

    return [parseManifest(filePath)];
  }

  const base = process.env.GITHUB_BASE_SHA?.trim();
  const head = process.env.GITHUB_SHA?.trim() || "HEAD";
  const paths = changedManifestPaths(base, head);

  return uniqueRecords(paths.map((relativePath) => parseManifest(path.join(repoRoot, relativePath))));
}

const records = resolveRecords();
const matrix = { include: records };

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(matrix)}\n`, "utf8");
  appendFileSync(process.env.GITHUB_OUTPUT, `count=${records.length}\n`, "utf8");
} else {
  console.log(JSON.stringify(matrix, null, 2));
}
