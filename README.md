# getcli

A unified installer for agent-friendly CLIs.

AI coding agents need CLI tools but have no standard way to discover, install, or verify them. getcli solves this with a curated registry and a single command interface.

## Install

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

## Usage

```bash
# Search for tools
getcli search deploy

# Show details
getcli info vercel

# Install a tool
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

## Skill templates

Agent instruction templates for popular AI coding tools are available in the `skills/` directory:

- `skills/claude-code.md` — Claude Code
- `skills/codex.md` — OpenAI Codex
- `skills/gemini-cli.md` — Gemini CLI

## Architecture

Monorepo with three components:

- `cli/` — Rust CLI (clap, serde, rust-embed)
- `web/` — Next.js website deployed to Cloudflare Pages
- `manifests/` — YAML tool definitions embedded at compile time

## License

Apache-2.0
