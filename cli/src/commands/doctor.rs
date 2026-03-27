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
    /// Tool ID to check
    pub tool: String,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

struct InstallerStatus {
    name: &'static str,
    available: bool,
    supported_by_tool: bool,
}

pub fn run(args: DoctorArgs) -> Result<()> {
    let manifests = registry::load_all()?;
    let manifest = registry::find_by_id(&manifests, &args.tool);

    let m = match manifest {
        Some(m) => m,
        None => {
            if args.json {
                println!(r#"{{"error": "not_found", "tool": "{}"}}"#, args.tool);
            } else {
                eprintln!("Tool \"{}\" not found in registry.", args.tool);
            }
            std::process::exit(1);
        }
    };

    let mut issues: Vec<String> = Vec::new();
    let installers = collect_installer_statuses(&m);

    // Check: command exists in PATH
    let installed = which_command(&m.command);

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

    if args.json {
        let output = serde_json::json!({
            "tool": m.id,
            "command": m.command,
            "installed": installed,
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
                    })
                })
                .collect::<Vec<_>>(),
        });
        println!("{}", serde_json::to_string_pretty(&output)?);
    } else {
        println!("Doctor: {} ({})", m.display_name, m.command);
        println!("  installed:  {}", if installed { "yes" } else { "no" });
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
            println!("    - {}: {} ({})", status.name, availability, support);
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
        },
        InstallerStatus {
            name: "npm",
            available: installer::get_installer(&InstallerType::Npm).detect(),
            supported_by_tool: npm_family_supported,
        },
        InstallerStatus {
            name: "pnpm",
            available: which_command("pnpm"),
            supported_by_tool: npm_family_supported,
        },
        InstallerStatus {
            name: "cargo",
            available: installer::get_installer(&InstallerType::Cargo).detect(),
            supported_by_tool: supported_methods
                .iter()
                .any(|method| **method == InstallerType::Cargo),
        },
        InstallerStatus {
            name: "uv",
            available: installer::get_installer(&InstallerType::Uv).detect(),
            supported_by_tool: supported_methods
                .iter()
                .any(|method| **method == InstallerType::Uv),
        },
        InstallerStatus {
            name: "pipx",
            available: installer::get_installer(&InstallerType::Pipx).detect(),
            supported_by_tool: supported_methods
                .iter()
                .any(|method| **method == InstallerType::Pipx),
        },
    ];

    statuses
}
