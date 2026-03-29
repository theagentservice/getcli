#!/bin/sh
set -e

# getcli installer — https://getcli.dev
# Usage: curl -fsSL https://getcli.dev/install.sh | sh

REPO="theagentservice/getcli"
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

    INSTALL_DIR="$(resolve_install_dir "$_os" "$_arch")"

    # Resolve latest version via GitHub release redirect to avoid API rate limits
    _version="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "$BASE_URL/latest" \
        | sed 's#.*/##')"

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

    say "Installed to $INSTALL_DIR/getcli"

    # Check PATH
    case ":$PATH:" in
        *":$INSTALL_DIR:"*) ;;
        *)
            newline
            warn "$INSTALL_DIR is not in your PATH."
            say "Add it by running:"
            newline
            say "  export PATH=\"$INSTALL_DIR:\$PATH\""
            newline
            say "To make it permanent, add the line above to ~/.bashrc, ~/.zshrc, or equivalent."
            ;;
    esac

    newline
    say "Run 'getcli --help' to get started."
}

say() {
    printf '%s\n' "$1"
}

err() {
    printf 'Error: %s\n' "$1" >&2
    exit 1
}

warn() {
    printf 'Warning: %s\n' "$1" >&2
}

newline() {
    printf '\n'
}

resolve_install_dir() {
    if [ -n "${GETCLI_INSTALL_DIR:-}" ]; then
        printf '%s\n' "$GETCLI_INSTALL_DIR"
        return
    fi

    case "$1:$2" in
        Darwin:arm64|Darwin:aarch64)
            for _dir in /opt/homebrew/bin /usr/local/bin; do
                if [ -d "$_dir" ] && [ -w "$_dir" ]; then
                    printf '%s\n' "$_dir"
                    return
                fi
            done
            ;;
        Darwin:x86_64)
            for _dir in /usr/local/bin /opt/homebrew/bin; do
                if [ -d "$_dir" ] && [ -w "$_dir" ]; then
                    printf '%s\n' "$_dir"
                    return
                fi
            done
            ;;
    esac

    printf '%s\n' "$HOME/.local/bin"
}

need_cmd() {
    if ! command -v "$1" > /dev/null 2>&1; then
        err "need '$1' (command not found)"
    fi
}

main "$@"
