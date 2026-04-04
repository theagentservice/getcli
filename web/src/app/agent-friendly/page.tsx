import type { Metadata } from "next";
import { faCircleCheck, faCircleMinus, faCircleQuestion, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import {
  checklistDimensions,
  verifiedChecklistTools,
  type VerificationStatus,
  verificationLabel,
} from "@/data/tool-verification";
import { absoluteUrl } from "@/lib/seo";

const pageDescription =
  "What makes a CLI agent-friendly: principles for automation, a command design checklist, and a verified scorecard of current registry tools.";

const principles = [
  {
    title: "Automatable",
    description:
      "The main workflow should run without prompts, pagers, or human-only handoffs. Agents need a CLI they can execute end-to-end on their own.",
  },
  {
    title: "Understandable",
    description:
      "The command surface, parameters, and outputs should be easy to discover. Agents should be able to learn how to use the CLI from the CLI itself through noun-verb hierarchy, self-describing flags, and clear help.",
  },
  {
    title: "Recoverable",
    description:
      "Failures should be diagnosable and actionable. Agents need to tell what went wrong and what to try next instead of stopping at a vague error.",
  },
  {
    title: "Controllable",
    description:
      "Mutating operations should be explicit and safe. Agents need preview and confirmation patterns that reduce blind writes, accidental changes, and unsafe retries.",
  },
] as const;

const requiredCommands = [
  {
    command: "--help",
    description:
      "Human-readable command discovery at the root and subcommand level, with examples first and clear required, optional, default, and allowed values.",
  },
  {
    command: "--version",
    description: "A stable version surface so agents can verify the runtime baseline.",
  },
  {
    command: "--json",
    description: "Machine-readable output on stdout for parsing and downstream automation.",
  },
  {
    command: "--yes",
    description: "A standard non-interactive confirmation path for commands that would otherwise prompt.",
  },
  {
    command: "--dry-run",
    description: "A preview mode that shows intended side effects without executing them.",
  },
  {
    command: "schema",
    description:
      "Machine-readable command and parameter introspection for agents, including forms like `cli schema --all` and `cli schema <command path>`.",
  },
] as const;

const behaviorNotes = [
  "Keep stdout and stderr separate so structured output stays parseable.",
  "Do not default into interactive shells, pagers, or setup wizards.",
  "Detect TTY vs non-TTY and disable color, spinner, pager, and prompts in automation.",
  "Prefer noun-verb command hierarchy and long self-describing flags over ambiguous short forms.",
  "Validate inputs strictly and prefer enums over free-form strings where possible.",
  "Design mutating commands to be idempotent or retry-safe.",
  "Use semantic exit codes so agents can distinguish classes of failure.",
  "Return errors that tell the agent what happened and how to recover.",
] as const;

export const metadata: Metadata = {
  title: "What Is Agent-Friendly?",
  description: pageDescription,
  alternates: {
    canonical: "/agent-friendly",
  },
  openGraph: {
    url: absoluteUrl("/agent-friendly"),
    title: "What Is Agent-Friendly? | getcli",
    description: pageDescription,
    type: "article",
  },
  twitter: {
    title: "What Is Agent-Friendly? | getcli",
    description: pageDescription,
  },
};

function capabilityIcon(status: VerificationStatus) {
  if (status === "supported") return faCircleCheck;
  if (status === "inconclusive") return faCircleMinus;
  if (status === "unverified") return faCircleQuestion;
  return faCircleXmark;
}

function capabilityIconClassName(status: VerificationStatus) {
  if (status === "supported") return "text-green-600";
  if (status === "inconclusive") return "text-amber-500";
  if (status === "unverified") return "text-slate-400";
  if (status === "error") return "text-red-500";
  return "text-gray-500";
}

export default function AgentFriendlyPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "What makes a CLI agent-friendly?",
    description: pageDescription,
    url: absoluteUrl("/agent-friendly"),
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 font-[family-name:var(--font-geist-mono)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            &larr; Home
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">What makes a CLI agent-friendly?</h1>
          <p className="mt-3 text-base text-gray-600">
            We do not treat “agent-friendly” as a vague badge. We define it with a small set of
            principles, a command design checklist, and a scorecard that shows how current registry
            tools stack up in practice.
          </p>
        </div>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">1. Principles</h2>
          <p className="mt-2 text-sm text-gray-600">
            These principles define what we mean by agent-friendly before we get into specific flags
            or implementation details.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {principles.map((principle) => (
              <div key={principle.title} className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="font-medium">{principle.title}</p>
                <p className="mt-1 text-sm text-gray-600">{principle.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">2. Command Design Checklist</h2>
          <p className="mt-2 text-sm text-gray-600">
            An agent-friendly CLI should expose a standard command surface built around noun-verb
            hierarchy and self-describing long flags. These are the required checkpoints we expect
            from command design.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <th className="w-40 whitespace-nowrap py-3 px-4 font-medium">Command</th>
                  <th className="py-3 px-4 font-medium">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {requiredCommands.map((item) => (
                  <tr key={item.command} className="border-b border-gray-100 align-top last:border-b-0">
                    <td className="w-40 whitespace-nowrap py-3 px-4 font-medium text-gray-900">
                      <code>{item.command}</code>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
            <p className="font-medium">Behavior expectations</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-600">
              {behaviorNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">3. Current Scorecard</h2>
              <p className="mt-2 text-sm text-gray-600">
                These are machine verification results for the command checklist above. Each row is
                tied to a manifest entry and reflects the latest saved CI verification result we
                have committed to the repo.
              </p>
            </div>
            <Link href="/registry" className="text-sm text-gray-900 underline underline-offset-4">
              Browse registry
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-600" />
              <span>Verified</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
              <FontAwesomeIcon icon={faCircleMinus} className="text-amber-500" />
              <span>Inconclusive</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
              <FontAwesomeIcon icon={faCircleQuestion} className="text-slate-400" />
              <span>Unverified</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
              <FontAwesomeIcon icon={faCircleXmark} className="text-gray-400" />
              <span>Not Observed</span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-3 pr-4 font-medium">CLI</th>
                  {checklistDimensions.map((dimension) => (
                    <th key={dimension.id} className="py-3 pr-4 font-medium">
                      {dimension.label}
                    </th>
                  ))}
                  <th className="py-3 pr-4 font-medium">Verified At</th>
                </tr>
              </thead>
              <tbody>
                {verifiedChecklistTools.map(({ tool, verification, checks }) => (
                  <tr key={tool.id} className="border-b border-gray-100 align-top">
                    <td className="py-4 pr-4">
                      <Link href={`/cli/${tool.id}`} className="font-medium hover:underline">
                        {tool.display_name}
                      </Link>
                      <div className="mt-1 text-xs text-gray-500">{tool.command}</div>
                    </td>
                    {checklistDimensions.map((dimension) => (
                      <td key={dimension.id} className="py-4 pr-4 text-gray-900">
                        <span
                          className="inline-flex items-center"
                          title={verificationLabel(checks[dimension.id].status)}
                          aria-label={verificationLabel(checks[dimension.id].status)}
                        >
                          <FontAwesomeIcon
                            icon={capabilityIcon(checks[dimension.id].status)}
                            className={`text-lg ${capabilityIconClassName(checks[dimension.id].status)}`}
                          />
                        </span>
                      </td>
                    ))}
                    <td className="py-4 pr-4 text-xs text-gray-500">
                      {verification ? verification.verified_at.slice(0, 10) : "Not yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
