mod commands;
mod installer;
mod manifest;
mod registry;
mod state;
mod upgrade_hint;

use anyhow::Result;
use clap::{CommandFactory, Parser, Subcommand};
use clap_complete::Shell;

#[derive(Parser)]
#[command(name = "getcli", version, about = "A unified installer for agent-friendly CLIs")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Search for a CLI tool by keyword
    Search(commands::search::SearchArgs),
    /// Show detailed info about a CLI tool
    Info(commands::info::InfoArgs),
    /// Install a CLI tool
    Install(commands::install::InstallArgs),
    /// Uninstall a CLI tool managed by getcli
    Uninstall(commands::uninstall::UninstallArgs),
    /// List installed CLI tools
    List(commands::list::ListArgs),
    /// Check if a CLI tool is installed and working
    Doctor(commands::doctor::DoctorArgs),
    /// Update getcli itself to the latest version
    Update(commands::update::UpdateArgs),
    /// Generate shell completions
    Completions(CompletionsArgs),
}

#[derive(clap::Args)]
struct CompletionsArgs {
    /// Shell to generate completions for
    #[arg(value_enum)]
    shell: Shell,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Search(args) => commands::search::run(args),
        Commands::Info(args) => commands::info::run(args),
        Commands::Install(args) => commands::install::run(args),
        Commands::Uninstall(args) => commands::uninstall::run(args),
        Commands::List(args) => commands::list::run(args),
        Commands::Doctor(args) => commands::doctor::run(args),
        Commands::Update(args) => commands::update::run(args),
        Commands::Completions(args) => {
            clap_complete::generate(
                args.shell,
                &mut Cli::command(),
                "getcli",
                &mut std::io::stdout(),
            );
            Ok(())
        }
    }
}
