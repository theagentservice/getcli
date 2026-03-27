# getcli — CLI Tool Installer (for OpenAI Codex)

`getcli` is a unified installer for CLI tools. Use it when a task requires a CLI tool that may not be installed.

## Setup

```bash
which getcli 2>/dev/null || curl -fsSL https://getcli.dev/install.sh | sh
```

## Usage pattern

```bash
# Step 1: Check if the needed tool exists
getcli doctor <tool> --json 2>/dev/null

# Step 2: If not installed, install it
getcli install <tool> --yes --json

# Step 3: Proceed with the task
<tool> <args>
```

## Key commands

| Command | Purpose |
|---------|---------|
| `getcli search <q> --json` | Find tools by keyword |
| `getcli info <id> --json` | Get install details |
| `getcli install <id> --yes --json` | Install non-interactively |
| `getcli doctor <id> --json` | Verify installation |

## Output format

All commands support `--json` for structured output. Always use `--json` and `--yes` flags.

## Available tools

Search the registry: `getcli search "" --json` to list all available tools.
