use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

const CHECK_INTERVAL_HOURS: i64 = 24;

#[derive(Debug, Default, Serialize, Deserialize)]
struct VersionCache {
    latest_version: Option<String>,
    checked_at: Option<DateTime<Utc>>,
}

/// Print an upgrade hint to stderr if a newer version is available.
/// Only checks once per 24 hours (cached). Does nothing in JSON/yes mode.
pub fn maybe_print_hint(json_mode: bool, yes_mode: bool) {
    if json_mode || yes_mode {
        return;
    }

    let current = env!("CARGO_PKG_VERSION");

    let cache = load_cache();
    let latest = match cache_fresh(&cache) {
        true => cache.latest_version,
        false => {
            // Fetch in best-effort manner, don't block on failure
            let fetched = fetch_latest_quiet();
            save_cache(&fetched);
            fetched
        }
    };

    if let Some(ref v) = latest
        && v != current
        && is_newer(v, current)
    {
        eprintln!(
            "\x1b[33mgetcli v{v} available (current: v{current}). Run `getcli update` to upgrade.\x1b[0m"
        );
    }
}

fn is_newer(latest: &str, current: &str) -> bool {
    let parse = |s: &str| -> Vec<u32> {
        s.split('.').filter_map(|p| p.parse().ok()).collect()
    };
    let l = parse(latest);
    let c = parse(current);
    l > c
}

fn cache_fresh(cache: &VersionCache) -> bool {
    match cache.checked_at {
        Some(t) => {
            let elapsed = Utc::now().signed_duration_since(t);
            elapsed.num_hours() < CHECK_INTERVAL_HOURS
        }
        None => false,
    }
}

fn fetch_latest_quiet() -> Option<String> {
    let output = std::process::Command::new("curl")
        .args([
            "-fsSL",
            "--connect-timeout",
            "3",
            "--max-time",
            "5",
            "-H",
            "Accept: application/vnd.github+json",
            "https://api.github.com/repos/theagentservice/getcli/releases/latest",
        ])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let body = String::from_utf8(output.stdout).ok()?;
    let json: serde_json::Value = serde_json::from_str(&body).ok()?;
    let tag = json["tag_name"].as_str()?;
    Some(tag.strip_prefix('v').unwrap_or(tag).to_string())
}

fn cache_path() -> PathBuf {
    dirs::cache_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"))
        .join("getcli")
        .join("version_check.json")
}

fn load_cache() -> VersionCache {
    let path = cache_path();
    if !path.exists() {
        return VersionCache::default();
    }
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_cache(latest: &Option<String>) {
    let cache = VersionCache {
        latest_version: latest.clone(),
        checked_at: Some(Utc::now()),
    };
    let path = cache_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = serde_json::to_string(&cache).map(|s| std::fs::write(&path, s));
}
