use anyhow::Result;
use chrono::Utc;
use clap::Args;
use std::process::Command;

use crate::installer;
use crate::installer::binary::which_command;
use crate::manifest::InstallerType;
use crate::registry;
use crate::state::State;

#[derive(Args)]
pub struct DoctorArgs {
    /// Tool ID to check. If omitted, checks the base environment.
    pub tool: Option<String>,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

struct InstallerStatus {
    name: &'static str,
    available: bool,
    supported_by_tool: bool,
    path: Option<String>,
    version: Option<String>,
    recommendation: &'static str,
}

pub fn run(args: DoctorArgs) -> Result<()> {
    if let Some(tool) = args.tool {
        return run_tool_doctor(tool, args.json);
    }

    run_environment_doctor(args.json)
}

fn run_tool_doctor(tool: String, json: bool) -> Result<()> {
    let manifests = registry::load_all()?;
    let manifest = registry::find_by_id(&manifests, &tool);

    let m = match manifest {
        Some(m) => m,
        None => {
            if json {
                println!(r#"{{"error": "not_found", "tool": "{}"}}"#, tool);
            } else {
                eprintln!("Tool \"{}\" not found in registry.", tool);
            }
            std::process::exit(1);
        }
    };

    let mut issues: Vec<String> = Vec::new();
    let installers = collect_installer_statuses(&m);

    // Check: command exists in PATH
    let installed = which_command(&m.command);
    let command_path = resolve_command_path(&m.command);

    if !installed {
        issues.push(format!("Command \"{}\" not found in PATH", m.command));
    }

    // Check: command is executable and returns version
    let version = if installed {
        Command::new(&m.command)
            .arg("--version")
            .output()
            .ok()
            .and_then(|o| {
                if o.status.success() {
                    String::from_utf8(o.stdout).ok().map(|s| s.trim().to_string())
                } else {
                    None
                }
            })
    } else {
        None
    };

    let executable = installed && version.is_some();
    if installed && version.is_none() {
        issues.push(format!("Command \"{}\" exists but --version failed", m.command));
    }

    // Check: prerequisites
    for prereq in &m.prerequisites {
        if !which_command(prereq) {
            issues.push(format!("Prerequisite \"{}\" not found", prereq));
        }
    }

    let passed = issues.is_empty();

    // Update state
    if let Ok(mut state) = State::load()
        && let Some(tool_state) = state.tools.get_mut(&m.id)
    {
        tool_state.last_doctor_at = Some(Utc::now());
        tool_state.doctor_passed = Some(passed);
        let _ = state.save();
    }

    if json {
        let output = serde_json::json!({
            "scope": "tool",
            "tool": m.id,
            "command": m.command,
            "installed": installed,
            "path": command_path,
            "executable": executable,
            "version": version,
            "passed": passed,
            "issues": issues,
            "installers": installers
                .iter()
                .map(|status| {
                    serde_json::json!({
                        "name": status.name,
                        "available": status.available,
                        "supported_by_tool": status.supported_by_tool,
                        "path": status.path,
                        "version": status.version,
                        "recommendation": status.recommendation,
                    })
                })
                .collect::<Vec<_>>(),
        });
        println!("{}", serde_json::to_string_pretty(&output)?);
    } else {
        println!("Doctor: {} ({})", m.display_name, m.command);
        println!("  installed:  {}", if installed { "yes" } else { "no" });
        if let Some(ref path) = command_path {
            println!("  path:       {path}");
        }
        println!("  executable: {}", if executable { "yes" } else { "no" });
        if let Some(ref v) = version {
            println!("  version:    {v}");
        }
        println!("  installers:");
        for status in &installers {
            let availability = if status.available { "yes" } else { "no" };
            let support = if status.supported_by_tool {
                "supported"
            } else {
                "not used by this tool"
            };
            match (&status.path, &status.version) {
                (Some(path), Some(version)) => {
                    println!(
                        "    - {}: {} ({}, {}, {}, {})",
                        status.name,
                        availability,
                        support,
                        status.recommendation,
                        path,
                        version
                    );
                }
                (Some(path), None) => {
                    println!(
                        "    - {}: {} ({}, {}, {})",
                        status.name, availability, support, status.recommendation, path
                    );
                }
                (None, Some(version)) => {
                    println!(
                        "    - {}: {} ({}, {}, version {})",
                        status.name, availability, support, status.recommendation, version
                    );
                }
                (None, None) => {
                    println!(
                        "    - {}: {} ({}, {})",
                        status.name, availability, support, status.recommendation
                    );
                }
            }
        }
        if issues.is_empty() {
            println!("  status:     OK");
        } else {
            println!("  issues:");
            for issue in &issues {
                println!("    - {issue}");
            }
        }
    }

    if !passed {
        std::process::exit(1);
    }

    Ok(())
}

fn run_environment_doctor(json: bool) -> Result<()> {
    let installers = collect_environment_installer_statuses();
    let path_entries = std::env::var("PATH")
        .ok()
        .map(|path| std::env::split_paths(&path).collect::<Vec<_>>())
        .unwrap_or_default();
    let path_configured = !path_entries.is_empty();
    let path_entries_display = path_entries
        .iter()
        .map(|entry| entry.display().to_string())
        .collect::<Vec<_>>();
    let mut issues: Vec<String> = Vec::new();

    if !path_configured {
        issues.push("PATH is empty or not set".to_string());
    }

    if !installers.iter().any(|status| status.available) {
        issues.push("No supported installer was found in PATH".to_string());
    }

    let passed = issues.is_empty();

    if json {
        let output = serde_json::json!({
            "scope": "environment",
            "path_configured": path_configured,
            "path_entries": path_entries_display,
            "passed": passed,
            "issues": issues,
            "installers": installers
                .iter()
                .map(|status| {
                    serde_json::json!({
                        "name": status.name,
                        "available": status.available,
                        "path": status.path,
                        "version": status.version,
                        "recommendation": status.recommendation,
                    })
                })
                .collect::<Vec<_>>(),
        });
        println!("{}", serde_json::to_string_pretty(&output)?);
    } else {
        println!("Doctor: environment");
        println!(
            "  path:       {}{}",
            if path_configured { "configured" } else { "missing" },
            if path_configured {
                format!(" ({} entries)", path_entries_display.len())
            } else {
                String::new()
            }
        );
        println!("  installers:");
        print_environment_installers_table(&installers);
        if issues.is_empty() {
            println!("  status:     OK");
        } else {
            println!("  issues:");
            for issue in &issues {
                println!("    - {issue}");
            }
        }
    }

    if !passed {
        std::process::exit(1);
    }

    Ok(())
}

fn collect_installer_statuses(m: &crate::manifest::Manifest) -> Vec<InstallerStatus> {
    let supported_methods = std::iter::once(&m.install.default.install_type)
        .chain(m.install.alternatives.iter().map(|alt| &alt.install_type))
        .collect::<Vec<_>>();

    let npm_family_supported = supported_methods
        .iter()
        .any(|method| **method == InstallerType::Npm);

    let statuses = vec![
        InstallerStatus {
            name: "brew",
            available: installer::get_installer(&InstallerType::Brew).detect(),
            supported_by_tool: supported_methods
                .iter()
                .any(|method| **method == InstallerType::Brew),
            path: resolve_command_path("brew"),
            version: command_version("brew"),
            recommendation: "n/a",
        },
        InstallerStatus {
            name: "npm",
            available: installer::get_installer(&InstallerType::Npm).detect(),
            supported_by_tool: npm_family_supported,
            path: resolve_command_path("npm"),
            version: command_version("npm"),
            recommendation: "n/a",
        },
        InstallerStatus {
            name: "pnpm",
            available: which_command("pnpm"),
            supported_by_tool: npm_family_supported,
            path: resolve_command_path("pnpm"),
            version: command_version("pnpm"),
            recommendation: "n/a",
        },
        InstallerStatus {
            name: "bun",
            available: which_command("bun"),
            supported_by_tool: npm_family_supported,
            path: resolve_command_path("bun"),
            version: command_version("bun"),
            recommendation: "n/a",
        },
        InstallerStatus {
            name: "cargo",
            available: installer::get_installer(&InstallerType::Cargo).detect(),
            supported_by_tool: supported_methods
                .iter()
                .any(|method| **method == InstallerType::Cargo),
            path: resolve_command_path("cargo"),
            version: command_version("cargo"),
            recommendation: "n/a",
        },
        InstallerStatus {
            name: "uv",
            available: installer::get_installer(&InstallerType::Uv).detect(),
            supported_by_tool: supported_methods
                .iter()
                .any(|method| **method == InstallerType::Uv),
            path: resolve_command_path("uv"),
            version: command_version("uv"),
            recommendation: "n/a",
        },
        InstallerStatus {
            name: "pipx",
            available: installer::get_installer(&InstallerType::Pipx).detect(),
            supported_by_tool: supported_methods
                .iter()
                .any(|method| **method == InstallerType::Pipx),
            path: resolve_command_path("pipx"),
            version: command_version("pipx"),
            recommendation: "n/a",
        },
    ];

    statuses
}

fn collect_environment_installer_statuses() -> Vec<InstallerStatus> {
    let is_macos = cfg!(target_os = "macos");
    let has_uv = which_command("uv");

    vec![
        InstallerStatus {
            name: "brew",
            available: installer::get_installer(&InstallerType::Brew).detect(),
            supported_by_tool: false,
            path: resolve_command_path("brew"),
            version: command_version("brew"),
            recommendation: if is_macos { "recommended" } else { "optional" },
        },
        InstallerStatus {
            name: "npm",
            available: installer::get_installer(&InstallerType::Npm).detect(),
            supported_by_tool: false,
            path: resolve_command_path("npm"),
            version: command_version("npm"),
            recommendation: "recommended",
        },
        InstallerStatus {
            name: "pnpm",
            available: which_command("pnpm"),
            supported_by_tool: false,
            path: resolve_command_path("pnpm"),
            version: command_version("pnpm"),
            recommendation: "recommended",
        },
        InstallerStatus {
            name: "bun",
            available: which_command("bun"),
            supported_by_tool: false,
            path: resolve_command_path("bun"),
            version: command_version("bun"),
            recommendation: "recommended",
        },
        InstallerStatus {
            name: "cargo",
            available: installer::get_installer(&InstallerType::Cargo).detect(),
            supported_by_tool: false,
            path: resolve_command_path("cargo"),
            version: command_version("cargo"),
            recommendation: "recommended",
        },
        InstallerStatus {
            name: "uv",
            available: installer::get_installer(&InstallerType::Uv).detect(),
            supported_by_tool: false,
            path: resolve_command_path("uv"),
            version: command_version("uv"),
            recommendation: "recommended",
        },
        InstallerStatus {
            name: "pipx",
            available: installer::get_installer(&InstallerType::Pipx).detect(),
            supported_by_tool: false,
            path: resolve_command_path("pipx"),
            version: command_version("pipx"),
            recommendation: if has_uv { "optional" } else { "recommended" },
        },
    ]
}

fn print_environment_installers_table(installers: &[InstallerStatus]) {
    let name_width = installers
        .iter()
        .map(|status| status.name.len())
        .max()
        .unwrap_or(4)
        .max("name".len());
    let available_width = "available".len();
    let recommendation_width = installers
        .iter()
        .map(|status| status.recommendation.len())
        .max()
        .unwrap_or("recommendation".len())
        .max("recommendation".len());

    println!(
        "    {name:<name_width$}  {available:<available_width$}  {recommendation:<recommendation_width$}  {path}  {version}",
        name = "name",
        available = "available",
        recommendation = "recommendation",
        path = "path",
        version = "version",
        name_width = name_width,
        available_width = available_width,
        recommendation_width = recommendation_width
    );
    println!(
        "    {name:-<name_width$}  {available:-<available_width$}  {recommendation:-<recommendation_width$}  ----  -------",
        name = "",
        available = "",
        recommendation = "",
        name_width = name_width,
        available_width = available_width,
        recommendation_width = recommendation_width
    );

    for status in installers {
        println!(
            "    {name:<name_width$}  {available:<available_width$}  {recommendation:<recommendation_width$}  {path}  {version}",
            name = status.name,
            available = if status.available { "yes" } else { "no" },
            recommendation = status.recommendation,
            path = status.path.as_deref().unwrap_or("-"),
            version = status.version.as_deref().unwrap_or("-"),
            name_width = name_width,
            available_width = available_width,
            recommendation_width = recommendation_width
        );
    }
}

fn resolve_command_path(command: &str) -> Option<String> {
    let output = if cfg!(windows) {
        Command::new("where").arg(command).output().ok()?
    } else {
        Command::new("which").arg(command).output().ok()?
    };

    if !output.status.success() {
        return None;
    }

    String::from_utf8(output.stdout)
        .ok()?
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(ToOwned::to_owned)
}

fn command_version(command: &str) -> Option<String> {
    let output = Command::new(command).arg("--version").output().ok()?;

    if !output.status.success() {
        return None;
    }

    String::from_utf8(output.stdout)
        .ok()?
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(ToOwned::to_owned)
}
