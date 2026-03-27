use anyhow::Result;
use clap::Args;
use std::process::Command;

#[derive(Args)]
pub struct UpdateArgs {
    /// Output as JSON
    #[arg(long)]
    pub json: bool,

    /// Skip confirmation prompt
    #[arg(long, short = 'y')]
    pub yes: bool,
}

pub fn run(args: UpdateArgs) -> Result<()> {
    let current_version = env!("CARGO_PKG_VERSION");
    let install_method = detect_install_method();

    // Query GitHub Releases API for latest version
    let latest = fetch_latest_version();

    if args.json {
        let status = match &latest {
            Ok(v) if v == current_version => "up_to_date",
            Ok(_) => "update_available",
            Err(_) => "check_failed",
        };
        println!(
            r#"{{"current_version": "{}", "latest_version": {}, "install_method": "{}", "status": "{}", "upgrade_command": "{}"}}"#,
            current_version,
            latest
                .as_ref()
                .map(|v| format!("\"{v}\""))
                .unwrap_or_else(|_| "null".to_string()),
            install_method.name(),
            status,
            install_method.upgrade_command(),
        );
        return Ok(());
    }

    eprintln!(
        "getcli v{current_version} (installed via {})",
        install_method.name()
    );

    match latest {
        Ok(ref v) if v == current_version => {
            eprintln!("Already up to date.");
            return Ok(());
        }
        Ok(ref v) => {
            eprintln!("New version available: v{v}");
            eprintln!();
            eprintln!("To upgrade, run:");
            eprintln!("  {}", install_method.upgrade_command());

            // Auto-upgrade for binary installs
            if matches!(install_method, InstallMethod::Binary)
                && (args.yes || confirm_upgrade()?)
            {
                return run_binary_self_update(v);
            }
        }
        Err(e) => {
            eprintln!("Could not check for updates: {e}");
            eprintln!();
            eprintln!("To upgrade manually, run:");
            eprintln!("  {}", install_method.upgrade_command());
        }
    }
    Ok(())
}

fn fetch_latest_version() -> Result<String> {
    let output = Command::new("curl")
        .args([
            "-fsSL",
            "-H",
            "Accept: application/vnd.github+json",
            "https://api.github.com/repos/theagentservice/getcli/releases/latest",
        ])
        .output()?;

    if !output.status.success() {
        anyhow::bail!("GitHub API request failed");
    }

    let body = String::from_utf8(output.stdout)?;
    let json: serde_json::Value = serde_json::from_str(&body)?;
    let tag = json["tag_name"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("No tag_name in response"))?;

    // Strip leading 'v' if present
    Ok(tag.strip_prefix('v').unwrap_or(tag).to_string())
}

fn run_binary_self_update(version: &str) -> Result<()> {
    let target = current_target();
    let ext = if cfg!(windows) { "zip" } else { "tar.gz" };
    let url = format!(
        "https://github.com/theagentservice/getcli/releases/download/v{version}/getcli-{target}.{ext}"
    );
    crate::installer::binary::install_from_url(&url, "getcli")
}

fn current_target() -> &'static str {
    if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        "aarch64-apple-darwin"
    } else if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
        "x86_64-apple-darwin"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "aarch64") {
        "aarch64-unknown-linux-gnu"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "x86_64") {
        "x86_64-unknown-linux-gnu"
    } else if cfg!(target_os = "windows") && cfg!(target_arch = "x86_64") {
        "x86_64-pc-windows-msvc"
    } else {
        "unknown"
    }
}

fn confirm_upgrade() -> Result<bool> {
    use dialoguer::Confirm;
    Ok(Confirm::new()
        .with_prompt("Upgrade now?")
        .default(true)
        .interact()?)
}

enum InstallMethod {
    Brew,
    Npm,
    Cargo,
    Binary,
}

impl InstallMethod {
    fn name(&self) -> &'static str {
        match self {
            Self::Brew => "brew",
            Self::Npm => "npm",
            Self::Cargo => "cargo",
            Self::Binary => "binary",
        }
    }

    fn upgrade_command(&self) -> &'static str {
        match self {
            Self::Brew => "brew upgrade getcli",
            Self::Npm => "npm update -g @agentservice/getcli",
            Self::Cargo => "cargo install getcli",
            Self::Binary => "curl -fsSL https://getcli.dev/install.sh | sh",
        }
    }
}

fn detect_install_method() -> InstallMethod {
    let bin_path = std::env::current_exe().unwrap_or_default();
    let path_str = bin_path.to_string_lossy();

    if path_str.contains("/homebrew/") || path_str.contains("/Cellar/") {
        return InstallMethod::Brew;
    }
    if path_str.contains("node_modules") || path_str.contains("/lib/node_modules/") {
        return InstallMethod::Npm;
    }
    if path_str.contains(".cargo/bin") {
        return InstallMethod::Cargo;
    }

    // Fallback: ask brew
    if let Ok(output) = Command::new("brew").args(["list", "getcli"]).output() {
        if output.status.success() {
            return InstallMethod::Brew;
        }
    }

    InstallMethod::Binary
}
