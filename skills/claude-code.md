# getcli — CLI Tool Installer (for Claude Code)

Use `getcli` to discover, install, and verify CLI tools.

## Bootstrap

```bash
# Check if getcli is available
which getcli || curl -fsSL https://getcli.dev/install.sh | sh
```

## Commands

```bash
# Search for tools (supports keywords, names, tags)
getcli search <query> --json

# Get tool details
getcli info <tool> --json

# Install a tool (non-interactive)
getcli install <tool> --yes --json

# Verify installation
getcli doctor <tool> --json

# List managed tools
getcli list --json
```

## Important flags

- `--json` — structured output, always use this
- `--yes` / `-y` — skip prompts, required for non-interactive use
- `--method <type>` — override install method (brew, npm, cargo, uv, pipx, binary)

## Workflow

1. `getcli search <keyword> --json` — find the right tool
2. `getcli install <tool-id> --yes --json` — install it
3. `getcli doctor <tool-id> --json` — verify it works

## Example

```bash
getcli search "deploy" --json
getcli install vercel --yes --json
getcli doctor vercel --json
vercel --version
```

## Notes

- All stdout is machine-readable when using `--json`
- Human-readable hints go to stderr only
- Exit code 0 = success, non-zero = failure
- The `--json` output includes error details on failure
