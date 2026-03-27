use anyhow::Result;
use clap::Args;

use crate::state::State;

#[derive(Args)]
pub struct ListArgs {
    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

pub fn run(args: ListArgs) -> Result<()> {
    let state = State::load()?;

    if state.tools.is_empty() {
        if args.json {
            println!("[]");
        } else {
            eprintln!("No tools tracked by getcli yet.");
            eprintln!("Try: getcli install <tool>");
        }
        return Ok(());
    }

    if args.json {
        let output: Vec<serde_json::Value> = state
            .tools
            .values()
            .map(|t| {
                serde_json::json!({
                    "id": t.id,
                    "command": t.command,
                    "installed": true,
                    "version": t.installed_version,
                    "source": t.install_method,
                    "installed_by_getcli": t.installed_by_getcli,
                    "last_checked_at": t.last_doctor_at,
                })
            })
            .collect();
        println!("{}", serde_json::to_string_pretty(&output)?);
    } else {
        for t in state.tools.values() {
            let ver = t.installed_version.as_deref().unwrap_or("unknown");
            let src = t.install_method.as_deref().unwrap_or("external");
            let managed = if t.installed_by_getcli { "" } else { " (tracked)" };
            println!("  {} ({}) v{} via {}{}", t.id, t.command, ver, src, managed);
        }
    }

    Ok(())
}
