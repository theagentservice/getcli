use anyhow::Result;
use clap::Args;

use crate::registry;

#[derive(Args)]
pub struct InfoArgs {
    /// Tool ID, name, or alias
    pub tool: String,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

pub fn run(args: InfoArgs) -> Result<()> {
    let manifests = registry::load_all()?;
    let manifest = registry::find_by_id(&manifests, &args.tool);

    match manifest {
        Some(m) => {
            if args.json {
                println!("{}", serde_json::to_string_pretty(&m)?);
            } else {
                println!("{} ({})", m.display_name, m.id);
                if let Some(desc) = &m.description {
                    println!("  {desc}");
                }
                println!();
                println!("  Command:        {}", m.command);
                if let Some(hp) = &m.homepage {
                    println!("  Homepage:       {hp}");
                }
                println!("  Platforms:      {:?}", m.platforms);
                println!("  Agent-friendly: {}", m.agent_friendly);
                println!("  Supports JSON:  {}", m.supports_json);
                if let Some(v) = &m.recommended_version {
                    println!("  Recommended:    {v}");
                }
                println!();
                println!("  Install (default): {} {}",
                    format!("{:?}", m.install.default.install_type).to_lowercase(),
                    m.install.default.package.as_deref().unwrap_or(""),
                );
                for alt in &m.install.alternatives {
                    let note = alt.note.as_deref().unwrap_or("");
                    println!("  Install (alt):     {} {} {note}",
                        format!("{:?}", alt.install_type).to_lowercase(),
                        alt.package.as_deref().or(alt.url.as_deref()).unwrap_or(""),
                    );
                }
                if !m.prerequisites.is_empty() {
                    println!("  Prerequisites:  {}", m.prerequisites.join(", "));
                }
                if !m.auth_notes.is_empty() {
                    println!();
                    println!("  Auth notes:");
                    for note in &m.auth_notes {
                        println!("    - {note}");
                    }
                }
                if !m.examples.is_empty() {
                    println!();
                    println!("  Examples:");
                    for ex in &m.examples {
                        println!("    $ {ex}");
                    }
                }
            }
        }
        None => {
            if args.json {
                println!(r#"{{"error": "not_found", "tool": "{}"}}"#, args.tool);
            } else {
                eprintln!("Tool \"{}\" not found in registry.", args.tool);
                eprintln!("Try: getcli search {}", args.tool);
            }
            std::process::exit(1);
        }
    }

    Ok(())
}
