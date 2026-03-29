import type { Metadata } from "next";
import Link from "next/link";
import InstallTabs, { type InstallTab } from "@/components/install-tabs";
import { featuredToolIds } from "@/data/tool-content";
import { tools } from "@/data/registry";
import {
  absoluteUrl,
  defaultDescription,
  defaultKeywords,
  organizationName,
  siteName,
} from "@/lib/seo";

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

const workflowCommands = [
  "getcli search github --json",
  "getcli install github --yes",
  "getcli doctor github --json",
].join("\n");

export const metadata: Metadata = {
  title: "A unified installer for agent-friendly CLIs",
  description: defaultDescription,
  keywords: [
    ...defaultKeywords,
    "install CLI tools",
    "agent-friendly CLI",
    "CLI doctor command",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: absoluteUrl("/"),
    title: "getcli | A unified installer for agent-friendly CLIs",
    description: defaultDescription,
  },
  twitter: {
    title: "getcli | A unified installer for agent-friendly CLIs",
    description: defaultDescription,
  },
};

export default function Home() {
  const featuredTools = featuredToolIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter((tool): tool is (typeof tools)[number] => tool !== undefined);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteName,
        url: absoluteUrl("/"),
        description: defaultDescription,
      },
      {
        "@type": "SoftwareApplication",
        name: siteName,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "macOS, Linux, Windows",
        description: defaultDescription,
        url: absoluteUrl("/"),
        creator: {
          "@type": "Organization",
          name: organizationName,
          url: "https://theagentservice.com",
        },
      },
    ],
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 font-[family-name:var(--font-geist-mono)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">getcli</h1>
        <p className="text-lg text-gray-600 mb-8">
          A unified installer for agent-friendly CLIs
        </p>

        <div className="mb-8 text-left text-sm">
          <p className="mb-2 text-gray-500"># Install getcli</p>
          <InstallTabs items={installChannels} />
          <p className="mb-2 mt-4 text-gray-500"># Search, install, verify</p>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
            <code>{workflowCommands}</code>
          </pre>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 text-left md:grid-cols-3">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Discover</h3>
            <p className="text-sm text-gray-600">
              Search a curated registry of CLI tools with ranked results and tag-based filtering.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Install</h3>
            <p className="text-sm text-gray-600">
              One command installs any tool via brew, npm, cargo, uv, pipx, or direct binary.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Verify</h3>
            <p className="text-sm text-gray-600">
              Built-in doctor checks that tools are installed, executable, and have prerequisites.
            </p>
          </div>
        </div>

        <div className="mb-8 text-left">
          <h2 className="text-xl font-semibold">Popular CLI Pages</h2>
          <p className="mt-2 text-sm text-gray-600">
            Browse install guides built for specific tools, not just the generic registry.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {featuredTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/cli/${tool.id}`}
                className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-400"
              >
                <p className="font-medium">{tool.display_name}</p>
                <p className="mt-1 text-sm text-gray-600">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-left text-sm">
          <h3 className="font-semibold mb-2">Agent-friendly by design</h3>
          <p className="text-gray-600 mb-2">
            Commands that return structured data support{" "}
            <code className="bg-gray-200 px-1 rounded">--json</code>, and commands that may prompt
            support <code className="bg-gray-200 px-1 rounded">--yes</code> for non-interactive
            use. In JSON mode, stdout stays machine-readable and human hints stay on stderr.
          </p>
          <p className="text-gray-600">
            Works with Claude Code, OpenAI Codex, Gemini CLI, and any AI coding agent.
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/registry"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Browse Registry
          </Link>
          <a
            href="https://github.com/theagentservice/getcli"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            GitHub
          </a>
          <Link
            href="/docs"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Docs
          </Link>
        </div>
      </div>
    </main>
  );
}
