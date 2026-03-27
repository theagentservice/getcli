import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const packageDir = path.join(repoRoot, "npm", "getcli");
const pkg = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));
const binTargets = Object.values(pkg.bin ?? {});

const packed = spawnSync("npm", ["pack", "--json", "--dry-run"], {
  cwd: packageDir,
  encoding: "utf8",
});

if (packed.status !== 0) {
  process.stderr.write(packed.stderr);
  process.exit(packed.status ?? 1);
}

const [{ files }] = JSON.parse(packed.stdout);
const packedPaths = new Set(files.map((file) => file.path));

for (const target of binTargets) {
  if (!packedPaths.has(target)) {
    throw new Error(`npm package is missing bin target "${target}"`);
  }
}

if (!packedPaths.has("bin/getcli.js")) {
  throw new Error('npm package is missing "bin/getcli.js"');
}

console.log("npm package smoke check passed");
