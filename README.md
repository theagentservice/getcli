# getcli

The CLI package manager and bootstrap layer for AI coding agents.

AI coding agents need a reliable way to discover, install, and verify developer CLIs without guessing vendor-specific commands. getcli provides a curated registry, a single install surface across common distribution channels, and verification checks for non-interactive workflows.

## Install

Pick the channel you already use:

```bash
# Shell (macOS / Linux)
curl -fsSL https://getcli.dev/install.sh | sh

# npm
npm install -g @agentservice/getcli

# Homebrew
brew install theagentservice/tap/getcli

# Cargo
cargo install getcli

# PowerShell (Windows)
irm https://getcli.dev/install.ps1 | iex
```

## Bootstrap workflow

Use `getcli` to find a tool, install it, and verify it before an agent depends on it.

```bash
# Search the registry
getcli search deploy

# Inspect a tool
getcli info vercel

# Install it
getcli install vercel --yes

# Verify it works
getcli doctor vercel

# List managed tools
getcli list

# Self-update
getcli update
```

## Agent-friendly by design

Commands that return structured data support `--json`, and commands that may prompt support `--yes` for non-interactive use. In JSON mode, stdout stays machine-readable and human hints stay on stderr.

```bash
# Structured output for agents
getcli search github --json
getcli install github --yes --json
getcli doctor github --json
```

## Registry

getcli ships with a curated registry of CLI tools. Browse them at [getcli.dev/registry](https://getcli.dev/registry) or search from the command line.

Currently includes: GitHub CLI, Vercel, Wrangler, Stripe, AWS, Docker, Terraform, kubectl, Fly.io, Supabase, Turso, Railway, Netlify, Firebase, and more.

### Adding a tool

Create a YAML manifest in `manifests/`:

```yaml
manifest_version: 1
id: mytool
name: mytool
display_name: My Tool
description: What it does
command: mytool
platforms: [macos, linux, windows]
agent_friendly: true
supports_json: true
install:
  default:
    type: brew
    package: mytool
tags: [category]
```

## Shell completions

```bash
# Bash
getcli completions bash >> ~/.bashrc

# Zsh
getcli completions zsh >> ~/.zshrc

# Fish
getcli completions fish > ~/.config/fish/completions/getcli.fish

# PowerShell
getcli completions powershell >> $PROFILE
```

## Agent skill

This repo ships a standard Agent Skills package in `skills/getcli/`.

Install it with the Skills CLI:

```bash
npx skills add theagentservice/getcli --skill getcli
```

Once installed, agents can use `getcli` to discover, install, and verify developer CLIs instead of guessing vendor-specific install commands.

## Architecture

Monorepo with three components:

- `cli/` — Rust CLI (clap, serde, rust-embed)
- `web/` — Next.js website deployed to Cloudflare Workers with OpenNext
- `manifests/` — YAML tool definitions embedded at compile time

## License

Apache-2.0
