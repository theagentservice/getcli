use anyhow::{Context, Result};
use std::path::PathBuf;
use std::process::Command;

use super::Installer;

pub struct BinaryInstaller;

impl BinaryInstaller {
    fn install_dir() -> PathBuf {
        if cfg!(windows) {
            dirs::data_local_dir()
                .unwrap_or_else(|| PathBuf::from("C:\\Users\\Default\\AppData\\Local"))
                .join("getcli")
                .join("bin")
        } else {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("/tmp"))
                .join(".local")
                .join("bin")
        }
    }
}

impl Installer for BinaryInstaller {
    fn detect(&self) -> bool {
        // Binary download is always available if we have curl or reqwest
        true
    }

    fn install(&self, _package: &str, _version: Option<&str>) -> Result<()> {
        // Binary installer requires a URL in the manifest's InstallMethod.
        // The actual URL-based install is handled by install_from_url.
        anyhow::bail!(
            "Binary install requires a download URL. Use `getcli install <tool> --method binary` \
             with a manifest that provides a binary download URL."
        )
    }

    fn check_installed(&self, command: &str) -> bool {
        which_command(command)
    }

    fn get_version(&self, command: &str) -> Option<String> {
        Command::new(command)
            .arg("--version")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok().map(|s| s.trim().to_string()))
    }
}

/// Install a binary from a URL. Downloads, extracts if needed, and places in ~/.local/bin.
pub fn install_from_url(url: &str, binary_name: &str) -> Result<()> {
    let install_dir = BinaryInstaller::install_dir();
    std::fs::create_dir_all(&install_dir)
        .with_context(|| format!("Failed to create install dir: {}", install_dir.display()))?;

    let temp_dir = tempfile::tempdir().context("Failed to create temp directory")?;

    // Download the file
    let file_name = url.rsplit('/').next().unwrap_or("download");
    let download_path = temp_dir.path().join(file_name);

    eprintln!("Downloading {}...", url);

    if cfg!(windows) {
        // Use PowerShell on Windows
        let status = Command::new("powershell")
            .args([
                "-Command",
                &format!(
                    "Invoke-WebRequest -Uri '{}' -OutFile '{}'",
                    url,
                    download_path.display()
                ),
            ])
            .status()
            .context("Failed to run PowerShell")?;
        if !status.success() {
            anyhow::bail!("Download failed");
        }
    } else {
        // Use curl on Unix
        let status = Command::new("curl")
            .args(["-fsSL", "-o"])
            .arg(&download_path)
            .arg(url)
            .status()
            .context("Failed to run curl")?;
        if !status.success() {
            anyhow::bail!("curl download failed");
        }
    }

    // Extract or copy
    let bin_name = if cfg!(windows) {
        format!("{binary_name}.exe")
    } else {
        binary_name.to_string()
    };

    let final_path = install_dir.join(&bin_name);

    if file_name.ends_with(".tar.gz") || file_name.ends_with(".tgz") {
        // Extract tar.gz
        let status = Command::new("tar")
            .args(["xzf"])
            .arg(&download_path)
            .arg("-C")
            .arg(temp_dir.path())
            .status()
            .context("Failed to extract tar.gz")?;
        if !status.success() {
            anyhow::bail!("tar extraction failed");
        }
        // Find the binary in extracted files
        let extracted = find_binary(temp_dir.path(), &bin_name)?;
        std::fs::copy(&extracted, &final_path).with_context(|| {
            format!(
                "Failed to copy {} to {}",
                extracted.display(),
                final_path.display()
            )
        })?;
    } else if file_name.ends_with(".zip") {
        // Extract zip
        if cfg!(windows) {
            let status = Command::new("powershell")
                .args([
                    "-Command",
                    &format!(
                        "Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
                        download_path.display(),
                        temp_dir.path().display()
                    ),
                ])
                .status()
                .context("Failed to extract zip")?;
            if !status.success() {
                anyhow::bail!("zip extraction failed");
            }
        } else {
            let status = Command::new("unzip")
                .args(["-o"])
                .arg(&download_path)
                .arg("-d")
                .arg(temp_dir.path())
                .status()
                .context("Failed to extract zip")?;
            if !status.success() {
                anyhow::bail!("unzip failed");
            }
        }
        let extracted = find_binary(temp_dir.path(), &bin_name)?;
        std::fs::copy(&extracted, &final_path).with_context(|| {
            format!(
                "Failed to copy {} to {}",
                extracted.display(),
                final_path.display()
            )
        })?;
    } else {
        // Assume it's a raw binary
        std::fs::copy(&download_path, &final_path)
            .context("Failed to copy downloaded binary")?;
    }

    // Make executable on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&final_path)?.permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&final_path, perms)?;
    }

    eprintln!("Installed to {}", final_path.display());

    // Check if install_dir is in PATH
    if let Ok(path_var) = std::env::var("PATH") {
        let in_path = std::env::split_paths(&path_var).any(|p| p == install_dir);
        if !in_path {
            eprintln!();
            eprintln!(
                "Warning: {} is not in your PATH.",
                install_dir.display()
            );
            if cfg!(windows) {
                eprintln!(
                    "Add it: [System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';{}', 'User')",
                    install_dir.display()
                );
            } else {
                eprintln!(
                    "Add it: export PATH=\"{}:$PATH\"",
                    install_dir.display()
                );
            }
        }
    }

    Ok(())
}

/// Recursively find a binary in the given directory.
fn find_binary(dir: &std::path::Path, name: &str) -> Result<PathBuf> {
    // First check the directory root
    let direct = dir.join(name);
    if direct.exists() {
        return Ok(direct);
    }

    // Search subdirectories (one level deep)
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let candidate = path.join(name);
                if candidate.exists() {
                    return Ok(candidate);
                }
            }
        }
    }

    anyhow::bail!(
        "Binary \"{}\" not found in extracted archive at {}",
        name,
        dir.display()
    )
}

/// Cross-platform command existence check.
pub fn which_command(command: &str) -> bool {
    if cfg!(windows) {
        Command::new("where")
            .arg(command)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    } else {
        Command::new("which")
            .arg(command)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
}
