import type { Metadata } from "next";
import Link from "next/link";
import CodeBlock from "@/components/code-block";
import InstallTabs, { type InstallTab } from "@/components/install-tabs";
import { absoluteUrl, organizationName, siteName } from "@/lib/seo";

const installChannels: InstallTab[] = [
  {
    id: "shell",
    label: "Shell",
    command: "curl -fsSL https://getcli.dev/install.sh | sh",
  },
  {
    id: "npm",
    label: "npm",
    command: "npm install -g @agentservice/getcli",
  },
  {
    id: "brew",
    label: "Homebrew",
    command: "brew install theagentservice/tap/getcli",
  },
  {
    id: "cargo",
    label: "Cargo",
    command: "cargo install getcli",
  },
  {
    id: "powershell",
    label: "PowerShell",
    command: "irm https://getcli.dev/install.ps1 | iex",
  },
];

const usageCommands = [
  "# Search for tools",
  "getcli search deploy",
  "",
  "# Show details",
  "getcli info vercel",
  "",
  "# Install a tool",
  "getcli install vercel --yes",
  "",
  "# Verify it works",
  "getcli doctor vercel",
  "",
  "# List managed tools",
  "getcli list",
  "",
  "# Self-update",
  "getcli update",
].join("\n");

const jsonCommands = [
  "getcli search github --json",
  "getcli install github --yes --json",
  "getcli doctor github --json",
].join("\n");

const docsDescription =
  "Documentation for getcli, including installation channels, usage examples, registry workflow, and agent-friendly command patterns.";

export const metadata: Metadata = {
  title: "Docs",
  description: docsDescription,
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    url: absoluteUrl("/docs"),
    title: "Docs | getcli",
    description: docsDescription,
    type: "article",
  },
  twitter: {
    title: "Docs | getcli",
    description: docsDescription,
  },
};

export default function DocsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "getcli Docs",
    description: docsDescription,
    url: absoluteUrl("/docs"),
    author: {
      "@type": "Organization",
      name: organizationName,
      url: "https://theagentservice.com",
    },
    publisher: {
      "@type": "Organization",
      name: organizationName,
      url: "https://theagentservice.com",
    },
    about: {
      "@type": "SoftwareApplication",
      name: siteName,
    },
  };

  return (
    <main className="min-h-screen p-8 font-[family-name:var(--font-geist-mono)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">
            &larr; getcli
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Docs</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            getcli is a unified installer for agent-friendly CLIs. Use it to discover, install,
            and verify the CLI tools your agent workflow depends on.
          </p>
        </div>

        <div className="space-y-8">
          <section className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Install</h2>
            <p className="mt-2 text-sm text-gray-600">
              Choose the distribution channel that fits your environment.
            </p>
            <InstallTabs items={installChannels} className="mt-4" />
          </section>

          <section className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Usage</h2>
            <p className="mt-2 text-sm text-gray-600">
              The core workflow is search, inspect, install, then verify.
            </p>
            <CodeBlock code={usageCommands} className="mt-4" />
          </section>

          <section className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Agent-Friendly Mode</h2>
            <p className="mt-2 text-sm text-gray-600">
              Commands that return structured data support <code>--json</code>, and commands that
              may prompt support <code>--yes</code> for non-interactive use.
            </p>
            <CodeBlock code={jsonCommands} className="mt-4" />
          </section>

          <section className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Registry</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tool definitions live in YAML manifests and are embedded into the CLI at build time.
              Browse the current catalog on the registry page or add a new manifest under{" "}
              <code>manifests/</code>.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/registry"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                Browse Registry
              </Link>
              <a
                href="https://github.com/theagentservice/getcli"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                GitHub Repository
              </a>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Skill Templates</h2>
            <p className="mt-2 text-sm text-gray-600">
              Templates for Claude Code, Codex, and Gemini CLI live in the repository under{" "}
              <code>skills/</code>. They tell agents to use getcli instead of guessing install
              commands.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
