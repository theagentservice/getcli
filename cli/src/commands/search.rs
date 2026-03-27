use anyhow::Result;
use clap::Args;

use crate::registry;
use crate::upgrade_hint;

#[derive(Args)]
pub struct SearchArgs {
    /// Search query (keyword, product name, or capability). Omit to list all.
    pub query: Option<String>,

    /// Filter results by tag
    #[arg(long)]
    pub tag: Option<String>,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

pub fn run(args: SearchArgs) -> Result<()> {
    let manifests = registry::load_all()?;
    let query = args.query.as_deref().unwrap_or("");
    let results = registry::search(&manifests, query, args.tag.as_deref());

    if results.is_empty() {
        if args.json {
            println!("[]");
        } else {
            eprintln!("No tools found for \"{query}\".");
            eprintln!("Try a different keyword or browse all with: getcli search");
        }
        upgrade_hint::maybe_print_hint(args.json, false);
        return Ok(());
    }

    if args.json {
        let output: Vec<serde_json::Value> = results
            .iter()
            .map(|m| {
                serde_json::json!({
                    "id": m.id,
                    "name": m.name,
                    "display_name": m.display_name,
                    "command": m.command,
                    "summary": m.description,
                    "install_default": format!("{:?}", m.install.default.install_type).to_lowercase(),
                    "agent_friendly": m.agent_friendly,
                })
            })
            .collect();
        println!("{}", serde_json::to_string_pretty(&output)?);
    } else {
        for m in &results {
            let af = if m.agent_friendly { " [agent-friendly]" } else { "" };
            println!(
                "  {} ({}) - {}{}",
                m.display_name,
                m.command,
                m.description.as_deref().unwrap_or(""),
                af
            );
        }
        upgrade_hint::maybe_print_hint(false, false);
    }

    Ok(())
}
