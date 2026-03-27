use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct State {
    #[serde(default)]
    pub tools: HashMap<String, ToolState>,
    #[serde(default)]
    pub registry_updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolState {
    pub id: String,
    pub command: String,
    pub installed_version: Option<String>,
    pub install_method: Option<String>,
    pub installed_at: DateTime<Utc>,
    pub installed_by_getcli: bool,
    pub last_doctor_at: Option<DateTime<Utc>>,
    pub doctor_passed: Option<bool>,
}

impl State {
    pub fn load() -> Result<Self> {
        let path = state_file_path();
        if !path.exists() {
            return Ok(Self::default());
        }
        let content = std::fs::read_to_string(&path)
            .with_context(|| format!("Failed to read state file: {}", path.display()))?;
        serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse state file: {}", path.display()))
    }

    pub fn save(&self) -> Result<()> {
        let path = state_file_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(&path, content)
            .with_context(|| format!("Failed to write state file: {}", path.display()))
    }
}

fn state_file_path() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("~/.local/share"))
        .join("getcli")
        .join("state.json")
}
