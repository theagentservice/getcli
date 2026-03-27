#!/usr/bin/env node

const { existsSync, copyFileSync, chmodSync } = require("fs");
const { join } = require("path");

const PLATFORM_MAP = {
  "darwin-arm64": "@agentservice/getcli-darwin-arm64",
  "darwin-x64": "@agentservice/getcli-darwin-x64",
  "linux-x64": "@agentservice/getcli-linux-x64",
  "linux-arm64": "@agentservice/getcli-linux-arm64",
  "win32-x64": "@agentservice/getcli-win32-x64",
};

function getPlatformPackage() {
  const key = `${process.platform}-${process.arch}`;
  const pkg = PLATFORM_MAP[key];
  if (!pkg) {
    console.error(
      `getcli: unsupported platform ${process.platform}-${process.arch}`
    );
    console.error(`Supported: ${Object.keys(PLATFORM_MAP).join(", ")}`);
    process.exit(1);
  }
  return pkg;
}

function getBinaryPath(pkg) {
  const binName = process.platform === "win32" ? "getcli.exe" : "getcli";
  try {
    const pkgDir = require.resolve(`${pkg}/package.json`);
    return join(pkgDir, "..", "bin", binName);
  } catch {
    return null;
  }
}

// When called with --install, copy the platform binary into place
if (process.argv.includes("--install")) {
  const pkg = getPlatformPackage();
  const src = getBinaryPath(pkg);
  if (!src || !existsSync(src)) {
    // Optional dep not installed — that's fine, user may have installed via cargo/brew
    process.exit(0);
  }
  const binName = process.platform === "win32" ? "getcli.exe" : "getcli";
  const dest = join(__dirname, binName);
  copyFileSync(src, dest);
  if (process.platform !== "win32") {
    chmodSync(dest, 0o755);
  }
  process.exit(0);
}

// Otherwise, run the binary
const { execFileSync } = require("child_process");
const binName = process.platform === "win32" ? "getcli.exe" : "getcli";
const binPath = join(__dirname, binName);

if (!existsSync(binPath)) {
  console.error(
    "getcli: binary not found. Try reinstalling: npm install -g @agentservice/getcli"
  );
  process.exit(1);
}

try {
  execFileSync(binPath, process.argv.slice(2), { stdio: "inherit" });
} catch (e) {
  process.exit(e.status ?? 1);
}
