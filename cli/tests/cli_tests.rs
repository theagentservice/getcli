use assert_cmd::Command;
use predicates::prelude::*;
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

fn getcli() -> Command {
    let mut cmd = Command::cargo_bin("getcli").unwrap();
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let test_root = std::env::temp_dir().join(format!(
        "getcli-test-{}-{unique}",
        std::process::id()
    ));
    let config_home = test_root.join("config");
    let home = test_root.join("home");
    fs::create_dir_all(&config_home).unwrap();
    fs::create_dir_all(&home).unwrap();
    cmd.env("XDG_CONFIG_HOME", &config_home);
    cmd.env("HOME", &home);
    cmd
}

#[test]
fn test_version() {
    getcli()
        .arg("--version")
        .assert()
        .success()
        .stdout(predicate::str::contains("getcli"));
}

#[test]
fn test_help() {
    getcli()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("agent-friendly CLIs"));
}

#[test]
fn test_search_github() {
    getcli()
        .args(["search", "github"])
        .assert()
        .success()
        .stdout(predicate::str::contains("GitHub CLI"));
}

#[test]
fn test_search_json() {
    getcli()
        .args(["search", "github", "--json"])
        .assert()
        .success()
        .stdout(predicate::str::contains("\"id\""));
}

#[test]
fn test_search_no_results() {
    getcli()
        .args(["search", "zzz_nonexistent_tool_zzz"])
        .assert()
        .success();
}

#[test]
fn test_search_by_tag() {
    getcli()
        .args(["search", "cloud", "--tag", "cloud"])
        .assert()
        .success();
}

#[test]
fn test_search_all() {
    // Empty query should list all manifests
    getcli()
        .args(["search", ""])
        .assert()
        .success();
}

#[test]
fn test_info_github() {
    getcli()
        .args(["info", "github"])
        .assert()
        .success()
        .stdout(predicate::str::contains("GitHub CLI"))
        .stdout(predicate::str::contains("gh"));
}

#[test]
fn test_info_json() {
    getcli()
        .args(["info", "github", "--json"])
        .assert()
        .success()
        .stdout(predicate::str::contains("\"command\""))
        .stdout(predicate::str::contains("\"gh\""));
}

#[test]
fn test_info_not_found() {
    getcli()
        .args(["info", "zzz_nonexistent_zzz"])
        .assert()
        .failure();
}

#[test]
fn test_info_by_alias() {
    getcli()
        .args(["info", "gh"])
        .assert()
        .success()
        .stdout(predicate::str::contains("GitHub CLI"));
}

#[test]
fn test_list_empty() {
    // Should not crash even with no state
    getcli()
        .args(["list"])
        .assert()
        .success();
}

#[test]
fn test_list_json() {
    getcli()
        .args(["list", "--json"])
        .assert()
        .success();
}

#[test]
fn test_doctor_not_found() {
    getcli()
        .args(["doctor", "zzz_nonexistent_zzz"])
        .assert()
        .failure();
}

#[test]
fn test_update_json() {
    // Just check it doesn't crash; actual update check may fail without network
    getcli()
        .args(["update", "--json"])
        .assert()
        .success();
}

#[test]
fn test_install_not_found() {
    getcli()
        .args(["install", "zzz_nonexistent_zzz", "--yes"])
        .assert()
        .failure();
}

#[test]
fn test_install_json_not_found() {
    getcli()
        .args(["install", "zzz_nonexistent_zzz", "--json"])
        .assert()
        .failure()
        .stdout(predicate::str::contains("not_found"));
}

#[test]
fn test_uninstall_not_tracked() {
    getcli()
        .args(["uninstall", "zzz_nonexistent_zzz", "--yes"])
        .assert()
        .failure();
}

#[test]
fn test_search_no_query_lists_all() {
    // No query arg should list all tools
    getcli()
        .args(["search"])
        .assert()
        .success()
        .stdout(predicate::str::contains("GitHub CLI"));
}

#[test]
fn test_completions_bash() {
    getcli()
        .args(["completions", "bash"])
        .assert()
        .success()
        .stdout(predicate::str::contains("getcli"));
}

#[test]
fn test_completions_zsh() {
    getcli()
        .args(["completions", "zsh"])
        .assert()
        .success()
        .stdout(predicate::str::contains("getcli"));
}

#[test]
fn test_completions_fish() {
    getcli()
        .args(["completions", "fish"])
        .assert()
        .success()
        .stdout(predicate::str::contains("getcli"));
}

#[test]
fn test_doctor_github_json() {
    // gh may or may not be installed, but should not crash
    getcli()
        .args(["doctor", "github", "--json"])
        .assert()
        .stdout(predicate::str::contains("\"tool\""))
        .stdout(predicate::str::contains("\"installers\""))
        .stdout(predicate::str::contains("\"brew\""))
        .stdout(predicate::str::contains("\"pnpm\""));
}

#[test]
fn test_doctor_text_includes_installers() {
    getcli()
        .args(["doctor", "github"])
        .assert()
        .stdout(predicate::str::contains("installers:"))
        .stdout(predicate::str::contains("brew:"))
        .stdout(predicate::str::contains("npm:"))
        .stdout(predicate::str::contains("pnpm:"));
}
