#!/bin/sh
set -e

# getcli installer — https://getcli.dev
# Usage: curl -fsSL https://getcli.dev/install.sh | sh

REPO="theagentservice/getcli"
INSTALL_DIR="${GETCLI_INSTALL_DIR:-$HOME/.local/bin}"
BASE_URL="https://github.com/$REPO/releases"

main() {
    need_cmd curl
    need_cmd tar

    local _arch _os _target _version _url _tmp

    _arch="$(uname -m)"
    _os="$(uname -s)"

    case "$_os" in
        Linux)
            case "$_arch" in
                x86_64)  _target="x86_64-unknown-linux-gnu" ;;
                aarch64) _target="aarch64-unknown-linux-gnu" ;;
                arm64)   _target="aarch64-unknown-linux-gnu" ;;
                *)       err "Unsupported architecture: $_arch" ;;
            esac
            ;;
        Darwin)
            case "$_arch" in
                x86_64)  _target="x86_64-apple-darwin" ;;
                arm64)   _target="aarch64-apple-darwin" ;;
                aarch64) _target="aarch64-apple-darwin" ;;
                *)       err "Unsupported architecture: $_arch" ;;
            esac
            ;;
        *)
            err "Unsupported OS: $_os. Use 'npm install -g @agentservice/getcli' instead."
            ;;
    esac

    # Get latest version from GitHub
    _version="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
        | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"//;s/".*//')"

    if [ -z "$_version" ]; then
        err "Failed to determine latest version."
    fi

    _url="$BASE_URL/download/$_version/getcli-$_target.tar.gz"

    say "Installing getcli $_version for $_target..."

    _tmp="$(mktemp -d)"
    trap 'rm -rf "$_tmp"' EXIT

    curl -fsSL -o "$_tmp/getcli.tar.gz" "$_url"
    tar xzf "$_tmp/getcli.tar.gz" -C "$_tmp"

    mkdir -p "$INSTALL_DIR"
    mv "$_tmp/getcli" "$INSTALL_DIR/getcli"
    chmod +x "$INSTALL_DIR/getcli"

    say "Installed getcli to $INSTALL_DIR/getcli"

    # Check PATH
    case ":$PATH:" in
        *":$INSTALL_DIR:"*) ;;
        *)
            say ""
            say "Warning: $INSTALL_DIR is not in your PATH."
            say "Add it by running:"
            say ""
            say "  export PATH=\"$INSTALL_DIR:\$PATH\""
            say ""
            say "To make it permanent, add the line above to ~/.bashrc, ~/.zshrc, or equivalent."
            ;;
    esac

    say ""
    say "Run 'getcli --help' to get started."
}

say() {
    echo "getcli: $1"
}

err() {
    say "error: $1" >&2
    exit 1
}

need_cmd() {
    if ! command -v "$1" > /dev/null 2>&1; then
        err "need '$1' (command not found)"
    fi
}

main "$@"
