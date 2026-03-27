use anyhow::Result;
use chrono::Utc;
use clap::Args;

use crate::installer;
use crate::manifest::InstallerType;
use crate::registry;
use crate::state::{State, ToolState};
use crate::upgrade_hint;

#[derive(Args)]
pub struct InstallArgs {
    /// Tool ID to install
    pub tool: String,

    /// Specify install method (brew, npm, uv, pipx, cargo, binary)
    #[arg(long)]
    pub method: Option<String>,

    /// Specify version to install
    #[arg(long)]
    pub version: Option<String>,

    /// Skip confirmation prompt (for Agent/CI use)
    #[arg(long, short = 'y')]
    pub yes: bool,

    /// Force reinstall even if already installed
    #[arg(long)]
    pub force: bool,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

pub fn run(args: InstallArgs) -> Result<()> {
    let manifests = registry::load_all()?;
    let manifest = registry::find_by_id(&manifests, &args.tool);

    let m = match manifest {
        Some(m) => m,
        None => {
            if args.json {
                println!(r#"{{"error": "not_found", "tool": "{}"}}"#, args.tool);
            } else {
                eprintln!("Tool \"{}\" not found in registry.", args.tool);
                eprintln!("Try: getcli search {}", args.tool);
            }
            std::process::exit(1);
        }
    };

    // Determine which install method to use
    let install_method = if let Some(ref method_str) = args.method {
        let target_type = parse_installer_type(method_str)?;
        if m.install.default.install_type == target_type {
            &m.install.default
        } else {
            m.install.alternatives.iter()
                .find(|a| a.install_type == target_type)
                .ok_or_else(|| anyhow::anyhow!(
                    "Install method \"{}\" is not available for \"{}\". Check `getcli info {}`.",
                    method_str, m.id, m.id
                ))?
        }
    } else {
        &m.install.default
    };

    let inst = installer::get_installer(&install_method.install_type);

    // Check if installer is available
    if !inst.detect() {
        let method_name = format!("{:?}", install_method.install_type).to_lowercase();
        if args.json {
            println!(r#"{{"error": "installer_not_available", "installer": "{method_name}", "tool": "{}"}}"#, m.id);
        } else {
            eprintln!(
                "Tool \"{}\" was found, but the default installer \"{}\" is not available on this machine.",
                m.display_name, method_name
            );
            if !m.install.alternatives.is_empty() {
                eprintln!("Available alternatives:");
                for alt in &m.install.alternatives {
                    let note = alt.note.as_deref().unwrap_or("");
                    eprintln!("  --method {} {note}", format!("{:?}", alt.install_type).to_lowercase());
                }
            }
        }
        std::process::exit(1);
    }

    // Check for conflicts
    if !args.force && inst.check_installed(&m.command) {
        let mut state = State::load()?;
        if state.tools.contains_key(&m.id) {
            if let Some(ver) = inst.get_version(&m.command) {
                if args.json {
                    println!(r#"{{"status": "already_installed", "tool": "{}", "version": "{}"}}"#, m.id, ver);
                } else {
                    eprintln!("\"{}\" is already installed (version: {}). Use --force to reinstall.", m.display_name, ver);
                }
            }
            return Ok(());
        } else {
            // Installed but not tracked by getcli
            if !args.yes {
                eprintln!("\"{}\" ({}) is already installed but not managed by getcli.", m.display_name, m.command);
                if !confirm("Track it with getcli?")? {
                    return Ok(());
                }
            }
            // Track it
            state.tools.insert(m.id.clone(), ToolState {
                id: m.id.clone(),
                command: m.command.clone(),
                installed_version: inst.get_version(&m.command),
                install_method: None,
                installed_at: Utc::now(),
                installed_by_getcli: false,
                last_doctor_at: None,
                doctor_passed: None,
            });
            state.save()?;
            if !args.json {
                println!("Tracked \"{}\" in getcli.", m.display_name);
            }
            return Ok(());
        }
    }

    // Confirm before install
    let method_name = format!("{:?}", install_method.install_type).to_lowercase();
    let package = install_method.package.as_deref().unwrap_or(&m.id);
    if !args.yes {
        eprintln!("Will install \"{}\" via {} (package: {})", m.display_name, method_name, package);
        if !confirm("Proceed?")? {
            eprintln!("Aborted.");
            return Ok(());
        }
    }

    // Install
    inst.install(package, args.version.as_deref())?;

    // Verify
    if inst.check_installed(&m.command) {
        let version = inst.get_version(&m.command);
        let mut state = State::load()?;
        state.tools.insert(m.id.clone(), ToolState {
            id: m.id.clone(),
            command: m.command.clone(),
            installed_version: version.clone(),
            install_method: Some(method_name.clone()),
            installed_at: Utc::now(),
            installed_by_getcli: true,
            last_doctor_at: None,
            doctor_passed: None,
        });
        state.save()?;

        if args.json {
            println!(r#"{{"status": "installed", "tool": "{}", "command": "{}", "version": {}, "method": "{}"}}"#,
                m.id, m.command,
                version.as_ref().map(|v| format!("\"{v}\"")).unwrap_or_else(|| "null".to_string()),
                method_name,
            );
        } else {
            println!("Installed \"{}\" successfully.", m.display_name);
            if let Some(v) = &version {
                println!("  command: {}", m.command);
                println!("  version: {v}");
            }
        }
    } else {
        if args.json {
            println!(r#"{{"error": "post_install_check_failed", "tool": "{}", "command": "{}"}}"#, m.id, m.command);
        } else {
            eprintln!("Installation completed but \"{}\" is not found in PATH.", m.command);
            eprintln!("Try: getcli doctor {}", m.id);
        }
        std::process::exit(1);
    }

    upgrade_hint::maybe_print_hint(args.json, args.yes);
    Ok(())
}

fn parse_installer_type(s: &str) -> Result<InstallerType> {
    match s.to_lowercase().as_str() {
        "brew" => Ok(InstallerType::Brew),
        "npm" => Ok(InstallerType::Npm),
        "uv" => Ok(InstallerType::Uv),
        "pipx" => Ok(InstallerType::Pipx),
        "cargo" => Ok(InstallerType::Cargo),
        "binary" => Ok(InstallerType::Binary),
        _ => anyhow::bail!("Unknown install method: \"{s}\". Supported: brew, npm, uv, pipx, cargo, binary"),
    }
}

fn confirm(prompt: &str) -> Result<bool> {
    use dialoguer::Confirm;
    Ok(Confirm::new().with_prompt(prompt).default(false).interact()?)
}
