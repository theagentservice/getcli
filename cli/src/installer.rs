pub mod brew;
pub mod npm;
pub mod uv;
pub mod pipx;
pub mod cargo;
pub mod binary;

use anyhow::Result;

use crate::manifest::InstallerType;

pub trait Installer {
    /// Check if this installer is available on the system.
    fn detect(&self) -> bool;

    /// Install a package, optionally at a specific version.
    fn install(&self, package: &str, version: Option<&str>) -> Result<()>;

    /// Check if a command is installed.
    fn check_installed(&self, command: &str) -> bool;

    /// Get the version of an installed command.
    fn get_version(&self, command: &str) -> Option<String>;
}

pub fn get_installer(installer_type: &InstallerType) -> Box<dyn Installer> {
    match installer_type {
        InstallerType::Brew => Box::new(brew::BrewInstaller),
        InstallerType::Npm => Box::new(npm::NpmInstaller),
        InstallerType::Uv => Box::new(uv::UvInstaller),
        InstallerType::Pipx => Box::new(pipx::PipxInstaller),
        InstallerType::Cargo => Box::new(cargo::CargoInstaller),
        InstallerType::Binary => Box::new(binary::BinaryInstaller),
    }
}
