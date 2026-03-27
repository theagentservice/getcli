use anyhow::Result;
use std::process::Command;

use super::Installer;
use super::binary::which_command;

pub struct UvInstaller;

impl Installer for UvInstaller {
    fn detect(&self) -> bool {
        Command::new("uv")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    fn install(&self, package: &str, version: Option<&str>) -> Result<()> {
        let mut cmd = Command::new("uv");
        cmd.args(["tool", "install"]);
        if let Some(v) = version {
            cmd.arg(format!("{package}=={v}"));
        } else {
            cmd.arg(package);
        }
        let status = cmd.status()?;
        if !status.success() {
            anyhow::bail!("uv tool install failed with exit code: {}", status);
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
