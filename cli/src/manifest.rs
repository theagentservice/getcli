use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub manifest_version: u32,
    pub id: String,
    pub name: String,
    pub display_name: String,
    #[serde(default)]
    pub homepage: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    pub command: String,
    #[serde(default)]
    pub aliases: Vec<String>,
    pub platforms: Vec<Platform>,
    pub agent_friendly: bool,
    #[serde(default)]
    pub supports_json: bool,
    #[serde(default)]
    pub recommended_version: Option<String>,
    pub install: InstallConfig,
    #[serde(default)]
    pub prerequisites: Vec<String>,
    #[serde(default)]
    pub auth_notes: Vec<String>,
    #[serde(default)]
    pub examples: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Macos,
    Linux,
    Windows,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallConfig {
    pub default: InstallMethod,
    #[serde(default)]
    pub alternatives: Vec<InstallMethod>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallMethod {
    #[serde(rename = "type")]
    pub install_type: InstallerType,
    #[serde(default)]
    pub package: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum InstallerType {
    Brew,
    Npm,
    Uv,
    Pipx,
    Cargo,
    Binary,
}
