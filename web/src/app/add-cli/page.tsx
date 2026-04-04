import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, organizationName, siteName } from "@/lib/seo";

const addCliDescription =
  "Contributor guide for adding a new CLI manifest to getcli, including the evidence required, quality bar, and review checklist.";

export const metadata: Metadata = {
  title: "Add a CLI",
  description: addCliDescription,
  alternates: {
    canonical: "/add-cli",
  },
  openGraph: {
    url: absoluteUrl("/add-cli"),
    title: "Add a CLI | getcli",
    description: addCliDescription,
    type: "article",
  },
  twitter: {
    title: "Add a CLI | getcli",
    description: addCliDescription,
  },
};

export default function AddCliPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Add a CLI to getcli",
    description: addCliDescription,
    url: absoluteUrl("/add-cli"),
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
    <main className="min-h-screen px-4 py-8 sm:px-8 font-[family-name:var(--font-geist-mono)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link href="/cli" className="text-sm text-gray-500 hover:text-gray-900">
            &larr; CLI Guides
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Add a CLI</h1>
          <p className="mt-3 max-w-3xl text-base text-gray-600">
            getcli is only useful if the catalog is accurate. This page explains how to submit a
            new manifest, what evidence reviewers expect, and why the bar is intentionally high.
          </p>
        </div>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">How to submit a CLI</h2>
          <ol className="mt-4 space-y-3 text-sm text-gray-700">
            <li>
              Create or update a manifest in <code>manifests/</code> using the official repository
              as the source of truth.
            </li>
            <li>
              Verify the commands, install paths, auth flow, and capability flags against the
              upstream docs or release notes.
            </li>
            <li>
              Open a PR and fill out every field in the PR template. If a capability does not
              exist, say so explicitly.
            </li>
            <li>
              Include evidence that another maintainer can reproduce the same result without
              guessing vendor-specific behavior.
            </li>
          </ol>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Evidence required</h2>
          <p className="mt-2 text-sm text-gray-600">
            Reviewers should be able to confirm the manifest from public sources, not only from
            the submitter&apos;s memory.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium">Source of truth</h3>
              <p className="mt-2 text-sm text-gray-600">
                Link the official repository and the docs page that defines the CLI.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium">Install proof</h3>
              <p className="mt-2 text-sm text-gray-600">
                Show the exact install commands for the supported channels and note any fallback.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium">Auth proof</h3>
              <p className="mt-2 text-sm text-gray-600">
                Explain the browser-based path and the headless or CI path if one exists.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium">Capability proof</h3>
              <p className="mt-2 text-sm text-gray-600">
                Document structured output, dry-run behavior, help output, and any skill support.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Why quality matters</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium">Search quality</h3>
              <p className="mt-2 text-sm text-gray-600">
                Bad manifests create bad registry results, which means broken discovery for users
                and agents.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium">Automation safety</h3>
              <p className="mt-2 text-sm text-gray-600">
                The wrong auth or install advice causes agent runs to stall, prompt, or fail in CI.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium">Maintenance cost</h3>
              <p className="mt-2 text-sm text-gray-600">
                High-quality manifests are easier to review, easier to update, and easier to trust
                later.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Required manifest fields</h2>
          <p className="mt-2 text-sm text-gray-600">
            A strong submission should make these fields obvious in the PR and match the manifest
            data exactly.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li>
              Official repo: link the upstream repository and keep the owner explicit.
            </li>
            <li>
              Install methods: list the default and any alternatives we should surface.
            </li>
            <li>
              Auth path: include the interactive path and the headless or CI path if one exists.
            </li>
            <li>
              Structured output: state whether <code>--json</code> exists and where it is used.
            </li>
            <li>
              Dry run: state whether <code>--dry-run</code> or a preview mode exists.
            </li>
            <li>
              Skills / support: note any official skill, extension, MCP, or agent integration.
            </li>
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Where to go next</h2>
          <p className="mt-2 text-sm text-gray-600">
            If the manifest is ready, open a PR with the template filled out and link the relevant
            docs or release notes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/registry"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Browse the registry
            </Link>
            <Link
              href="/cli"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              Review CLI guides
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Read the docs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
