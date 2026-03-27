use anyhow::Result;
use clap::Args;
use dialoguer::Confirm;

use crate::state::State;

#[derive(Args)]
pub struct UninstallArgs {
    /// Tool ID to uninstall
    pub tool: String,

    /// Skip confirmation prompt
    #[arg(long, short = 'y')]
    pub yes: bool,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

pub fn run(args: UninstallArgs) -> Result<()> {
    let mut state = State::load()?;

    let tool_state = match state.tools.get(&args.tool) {
        Some(t) => t.clone(),
        None => {
            if args.json {
                println!(r#"{{"error": "not_tracked", "tool": "{}"}}"#, args.tool);
            } else {
                eprintln!("Tool \"{}\" is not managed by getcli.", args.tool);
            }
            std::process::exit(1);
        }
    };

    if !tool_state.installed_by_getcli {
        // Only remove tracking
        if !args.yes {
            eprintln!(
                "\"{}\" was not installed by getcli. Only the tracking record will be removed.",
                args.tool
            );
            if !Confirm::new()
                .with_prompt("Remove tracking?")
                .default(false)
                .interact()?
            {
                return Ok(());
            }
        }
        state.tools.remove(&args.tool);
        state.save()?;
        if args.json {
            println!(
                r#"{{"status": "tracking_removed", "tool": "{}"}}"#,
                args.tool
            );
        } else {
            println!("Removed tracking for \"{}\".", args.tool);
        }
        return Ok(());
    }

    // Confirm before uninstall
    if !args.yes
        && !Confirm::new()
            .with_prompt(format!(
                "Uninstall \"{}\" ({})?",
                args.tool, tool_state.command
            ))
            .default(false)
            .interact()?
    {
        eprintln!("Aborted.");
        return Ok(());
    }

    // Attempt uninstall based on install method
    let result = match tool_state.install_method.as_deref() {
        Some("brew") => run_uninstall("brew", &["uninstall", &args.tool]),
        Some("npm") => run_uninstall("npm", &["uninstall", "-g", &args.tool]),
        Some("cargo") => run_uninstall("cargo", &["uninstall", &args.tool]),
        Some("pipx") => run_uninstall("pipx", &["uninstall", &args.tool]),
        Some("uv") => run_uninstall("uv", &["tool", "uninstall", &args.tool]),
        Some("binary") => remove_binary(&tool_state.command),
        _ => Err(anyhow::anyhow!(
            "Cannot determine uninstall method. Please remove manually."
        )),
    };

    match result {
        Ok(()) => {
            state.tools.remove(&args.tool);
            state.save()?;
            if args.json {
                println!(r#"{{"status": "uninstalled", "tool": "{}"}}"#, args.tool);
            } else {
                println!("Uninstalled \"{}\".", args.tool);
            }
        }
        Err(e) => {
            if args.json {
                println!(
                    r#"{{"error": "uninstall_failed", "tool": "{}", "message": "{}"}}"#,
                    args.tool, e
                );
            } else {
                eprintln!("Failed to uninstall \"{}\": {e}", args.tool);
                eprintln!("The tracking record has been kept. Please uninstall manually.");
            }
            std::process::exit(1);
        }
    }

    Ok(())
}

fn run_uninstall(cmd: &str, args: &[&str]) -> Result<()> {
    let status = std::process::Command::new(cmd).args(args).status()?;
    if !status.success() {
        anyhow::bail!("{} exited with code: {}", cmd, status);
    }
    Ok(())
}

fn remove_binary(command: &str) -> Result<()> {
    let install_dir = if cfg!(windows) {
        dirs::data_local_dir()
            .unwrap_or_default()
            .join("getcli")
            .join("bin")
    } else {
        dirs::home_dir().unwrap_or_default().join(".local").join("bin")
    };

    let bin_name = if cfg!(windows) {
        format!("{command}.exe")
    } else {
        command.to_string()
    };

    let bin_path = install_dir.join(&bin_name);
    if bin_path.exists() {
        std::fs::remove_file(&bin_path)?;
        eprintln!("Removed {}", bin_path.display());
        Ok(())
    } else {
        // Also check if it's somewhere in PATH
        let which_cmd = if cfg!(windows) { "where" } else { "which" };
        if let Ok(output) = std::process::Command::new(which_cmd).arg(command).output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                eprintln!(
                    "Binary found at {path} but was not installed to the getcli binary dir."
                );
                eprintln!("Please remove it manually: rm {path}");
            }
        }
        anyhow::bail!(
            "Binary \"{}\" not found at {}",
            bin_name,
            bin_path.display()
        )
    }
}
