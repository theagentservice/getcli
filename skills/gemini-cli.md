# getcli — CLI Tool Installer (for Gemini CLI)

getcli provides a unified way to discover, install, and verify CLI tools.

## Quick start

```bash
# Ensure getcli is available
command -v getcli >/dev/null 2>&1 || curl -fsSL https://getcli.dev/install.sh | sh

# Search, install, verify
getcli search github --json
getcli install github --yes --json
getcli doctor github --json
```

## Flags for automation

Always use these flags when calling getcli programmatically:
- `--json` — machine-readable JSON output on stdout
- `--yes` (`-y`) — skip all interactive prompts

## JSON output examples

### Search
```json
[{"id": "github", "name": "github", "display_name": "GitHub CLI", "command": "gh", "agent_friendly": true}]
```

### Install
```json
{"status": "installed", "tool": "github", "command": "gh", "version": "2.40.0", "method": "brew"}
```

### Doctor
```json
{"tool": "github", "command": "gh", "installed": true, "executable": true, "version": "2.40.0", "passed": true, "issues": []}
```

## Error handling

On failure, JSON output includes an `"error"` field. Check exit code: 0 = success, non-zero = failure.
