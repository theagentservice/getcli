use anyhow::Result;
use std::process::Command;

use super::Installer;
use super::binary::which_command;

pub struct PipxInstaller;

impl Installer for PipxInstaller {
    fn detect(&self) -> bool {
        Command::new("pipx")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    fn install(&self, package: &str, version: Option<&str>) -> Result<()> {
        let pkg = match version {
            Some(v) => format!("{package}=={v}"),
            None => package.to_string(),
        };
        let status = Command::new("pipx")
            .args(["install", &pkg])
            .status()?;
        if !status.success() {
            anyhow::bail!("pipx install failed with exit code: {}", status);
        }
        Ok(())
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
