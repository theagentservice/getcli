use anyhow::{Context, Result};
use chrono::Utc;
use rust_embed::Embed;
use std::path::PathBuf;

use crate::manifest::Manifest;
use crate::state::State;

#[derive(Embed)]
#[folder = "manifests/"]
#[include = "*.yaml"]
struct EmbeddedManifests;

const REGISTRY_URL: &str =
    "https://api.github.com/repos/theagentservice/getcli/contents/manifests";
const REFRESH_INTERVAL_DAYS: i64 = 7;

/// Load all manifests: local overrides take precedence over embedded ones.
/// Triggers a background-style auto-refresh if the registry hasn't been updated in 7 days.
pub fn load_all() -> Result<Vec<Manifest>> {
    // Check if auto-refresh is needed (best-effort, non-blocking)
    try_auto_refresh();

    let mut manifests = Vec::new();
    let mut seen_ids = std::collections::HashSet::new();

    // 1. Load local overrides first (higher priority)
    let local_dir = local_manifests_dir();
    if local_dir.exists() {
        for entry in std::fs::read_dir(&local_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().is_some_and(|e| e == "yaml" || e == "yml") {
                let content = std::fs::read_to_string(&path)
                    .with_context(|| format!("Failed to read {}", path.display()))?;
                let m: Manifest = serde_yaml::from_str(&content)
                    .with_context(|| format!("Failed to parse {}", path.display()))?;
                seen_ids.insert(m.id.clone());
                manifests.push(m);
            }
        }
    }

    // 2. Load embedded manifests (skip if overridden)
    for file in <EmbeddedManifests as Embed>::iter() {
        if let Some(data) = <EmbeddedManifests as Embed>::get(&file) {
            let content = std::str::from_utf8(data.data.as_ref())
                .with_context(|| format!("Invalid UTF-8 in embedded manifest {file}"))?;
            let m: Manifest = serde_yaml::from_str(content)
                .with_context(|| format!("Failed to parse embedded manifest {file}"))?;
            if !seen_ids.contains(&m.id) {
                seen_ids.insert(m.id.clone());
                manifests.push(m);
            }
        }
    }

    Ok(manifests)
}

/// Search manifests by query with ranked relevance.
pub fn search(manifests: &[Manifest], query: &str, tag_filter: Option<&str>) -> Vec<Manifest> {
    let query_lower = query.to_lowercase();
    let mut scored: Vec<(i32, &Manifest)> = Vec::new();

    for m in manifests {
        // Apply tag filter
        if let Some(tag) = tag_filter {
            if !m.tags.iter().any(|t| t.eq_ignore_ascii_case(tag)) {
                continue;
            }
        }

        let score = compute_score(m, &query_lower);
        if score > 0 {
            scored.push((score, m));
        }
    }

    // Sort: higher score first, then agent_friendly first
    scored.sort_by(|a, b| {
        b.0.cmp(&a.0)
            .then_with(|| b.1.agent_friendly.cmp(&a.1.agent_friendly))
    });

    scored.into_iter().map(|(_, m)| m.clone()).collect()
}

fn compute_score(m: &Manifest, query: &str) -> i32 {
    // Empty query matches everything (browse mode)
    if query.is_empty() {
        return 1;
    }

    // Level 1: exact match on id / name / command / aliases
    if m.id.eq_ignore_ascii_case(query)
        || m.name.eq_ignore_ascii_case(query)
        || m.command.eq_ignore_ascii_case(query)
        || m.aliases.iter().any(|a| a.eq_ignore_ascii_case(query))
    {
        return 100;
    }

    // Level 2: prefix match
    if m.id.to_lowercase().starts_with(query)
        || m.name.to_lowercase().starts_with(query)
        || m.command.to_lowercase().starts_with(query)
    {
        return 80;
    }

    // Level 3: tag match
    if m.tags.iter().any(|t| t.eq_ignore_ascii_case(query)) {
        return 60;
    }

    // Level 4: substring match on description / display_name
    if m.display_name.to_lowercase().contains(query)
        || m.description
            .as_deref()
            .is_some_and(|d| d.to_lowercase().contains(query))
    {
        return 40;
    }

    // Level 5: substring match on id / name
    if m.id.to_lowercase().contains(query) || m.name.to_lowercase().contains(query) {
        return 20;
    }

    0
}

pub fn find_by_id(manifests: &[Manifest], id: &str) -> Option<Manifest> {
    manifests
        .iter()
        .find(|m| {
            m.id.eq_ignore_ascii_case(id)
                || m.name.eq_ignore_ascii_case(id)
                || m.aliases.iter().any(|a| a.eq_ignore_ascii_case(id))
        })
        .cloned()
}

fn local_manifests_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("~/.config"))
        .join("getcli")
        .join("manifests")
}

/// Try to auto-refresh the registry if it hasn't been updated recently.
/// This is best-effort and won't block or fail the main operation.
fn try_auto_refresh() {
    let state = match State::load() {
        Ok(s) => s,
        Err(_) => return,
    };

    let needs_refresh = match state.registry_updated_at {
        Some(last_updated) => {
            let elapsed = Utc::now().signed_duration_since(last_updated);
            elapsed.num_days() >= REFRESH_INTERVAL_DAYS
        }
        None => true,
    };

    if needs_refresh {
        let _ = refresh_registry();
    }
}

/// Download latest manifests from the GitHub repository into the local config dir.
/// Uses conditional requests (ETag) to avoid GitHub API rate limits.
fn refresh_registry() -> Result<()> {
    let local_dir = local_manifests_dir();
    std::fs::create_dir_all(&local_dir)?;

    let etag_path = local_dir.join(".etag");
    let old_etag = std::fs::read_to_string(&etag_path).unwrap_or_default();

    // Build curl args with conditional request
    let mut curl_args = vec![
        "-fsSL".to_string(),
        "--connect-timeout".to_string(),
        "5".to_string(),
        "--max-time".to_string(),
        "15".to_string(),
        "-H".to_string(),
        "Accept: application/vnd.github+json".to_string(),
        "-D".to_string(),
        "-".to_string(), // dump headers to stdout
    ];
    if !old_etag.is_empty() {
        curl_args.push("-H".to_string());
        curl_args.push(format!("If-None-Match: {}", old_etag.trim()));
    }
    curl_args.push(REGISTRY_URL.to_string());

    let output = std::process::Command::new("curl")
        .args(&curl_args)
        .output()?;

    let raw = String::from_utf8_lossy(&output.stdout);

    // Check for 304 Not Modified
    if raw.contains("HTTP/2 304") || raw.contains("304 Not Modified") {
        // Registry hasn't changed, just update timestamp
        let mut state = State::load().unwrap_or_default();
        state.registry_updated_at = Some(Utc::now());
        let _ = state.save();
        return Ok(());
    }

    if !output.status.success() {
        anyhow::bail!("Failed to fetch registry index");
    }

    // Parse response — headers and body are mixed when using -D -
    // Re-fetch without -D for clean body
    let body_output = std::process::Command::new("curl")
        .args([
            "-fsSL",
            "--connect-timeout",
            "5",
            "--max-time",
            "15",
            "-H",
            "Accept: application/vnd.github+json",
            REGISTRY_URL,
        ])
        .output()?;

    if !body_output.status.success() {
        anyhow::bail!("Failed to fetch registry index");
    }

    // Save new ETag from headers
    let header_output = std::process::Command::new("curl")
        .args([
            "-fsSI",
            "--connect-timeout",
            "5",
            "--max-time",
            "5",
            "-H",
            "Accept: application/vnd.github+json",
            REGISTRY_URL,
        ])
        .output()?;
    if header_output.status.success() {
        let headers = String::from_utf8_lossy(&header_output.stdout);
        for line in headers.lines() {
            if let Some(etag) = line.strip_prefix("etag: ").or_else(|| line.strip_prefix("ETag: "))
            {
                let _ = std::fs::write(&etag_path, etag.trim());
                break;
            }
        }
    }

    let body = String::from_utf8(body_output.stdout)?;
    let files: Vec<serde_json::Value> = serde_json::from_str(&body)?;

    for file in &files {
        let name = file["name"].as_str().unwrap_or("");
        if !name.ends_with(".yaml") && !name.ends_with(".yml") {
            continue;
        }
        let download_url = match file["download_url"].as_str() {
            Some(u) => u,
            None => continue,
        };

        let dl_output = std::process::Command::new("curl")
            .args(["-fsSL", "--connect-timeout", "5", "--max-time", "10", download_url])
            .output()?;

        if dl_output.status.success() {
            let dest = local_dir.join(name);
            std::fs::write(&dest, &dl_output.stdout)?;
        }
    }

    // Update timestamp
    let mut state = State::load().unwrap_or_default();
    state.registry_updated_at = Some(Utc::now());
    let _ = state.save();

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::manifest::*;

    fn sample_manifest(id: &str, name: &str, command: &str) -> Manifest {
        Manifest {
            manifest_version: 1,
            id: id.to_string(),
            name: name.to_string(),
            display_name: name.to_string(),
            homepage: None,
            description: Some(format!("A tool called {name}")),
            command: command.to_string(),
            aliases: vec![],
            platforms: vec![Platform::Macos, Platform::Linux],
            agent_friendly: true,
            supports_json: false,
            recommended_version: None,
            install: InstallConfig {
                default: InstallMethod {
                    install_type: InstallerType::Brew,
                    package: Some(id.to_string()),
                    url: None,
                    note: None,
                },
                alternatives: vec![],
            },
            prerequisites: vec![],
            auth_notes: vec![],
            examples: vec![],
            tags: vec!["test".to_string()],
        }
    }

    #[test]
    fn test_exact_match_scores_highest() {
        let m = sample_manifest("github", "github", "gh");
        assert_eq!(compute_score(&m, "github"), 100);
        assert_eq!(compute_score(&m, "gh"), 100);
    }

    #[test]
    fn test_prefix_match() {
        let m = sample_manifest("github", "github", "gh");
        assert_eq!(compute_score(&m, "git"), 80);
    }

    #[test]
    fn test_tag_match() {
        let m = sample_manifest("github", "github", "gh");
        assert_eq!(compute_score(&m, "test"), 60);
    }

    #[test]
    fn test_description_match() {
        let m = sample_manifest("github", "github", "gh");
        assert_eq!(compute_score(&m, "tool called"), 40);
    }

    #[test]
    fn test_id_substring_match() {
        let mut m = sample_manifest("github", "github", "gh");
        // display_name won't contain "ithu" if we set it differently
        m.display_name = "GH CLI".to_string();
        m.description = Some("A version control tool".to_string());
        assert_eq!(compute_score(&m, "ithu"), 20);
    }

    #[test]
    fn test_no_match() {
        let m = sample_manifest("github", "github", "gh");
        assert_eq!(compute_score(&m, "zzzzz"), 0);
    }

    #[test]
    fn test_empty_query_matches_all() {
        let m = sample_manifest("github", "github", "gh");
        assert_eq!(compute_score(&m, ""), 1);
    }

    #[test]
    fn test_search_ordering() {
        let manifests = vec![
            sample_manifest("vercel", "vercel", "vercel"),
            sample_manifest("github", "github", "gh"),
        ];
        let results = search(&manifests, "github", None);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "github");
    }

    #[test]
    fn test_search_tag_filter() {
        let mut m1 = sample_manifest("github", "github", "gh");
        m1.tags = vec!["scm".to_string()];
        let mut m2 = sample_manifest("vercel", "vercel", "vercel");
        m2.tags = vec!["deploy".to_string()];

        let manifests = vec![m1, m2];
        let results = search(&manifests, "", Some("scm"));
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "github");
    }

    #[test]
    fn test_find_by_id() {
        let manifests = vec![
            sample_manifest("github", "github", "gh"),
            sample_manifest("vercel", "vercel", "vercel"),
        ];
        assert!(find_by_id(&manifests, "github").is_some());
        assert!(find_by_id(&manifests, "GitHub").is_some()); // case insensitive
        assert!(find_by_id(&manifests, "nonexistent").is_none());
    }

    #[test]
    fn test_find_by_alias() {
        let mut m = sample_manifest("github", "github", "gh");
        m.aliases = vec!["gh".to_string()];
        let manifests = vec![m];
        assert!(find_by_id(&manifests, "gh").is_some());
    }
}
