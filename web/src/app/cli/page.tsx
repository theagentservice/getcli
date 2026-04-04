import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/data/registry";
import { absoluteUrl, siteName } from "@/lib/seo";

const cliPageDescription =
  "Browse all getcli CLI landing pages. Find install guides, prerequisites, auth notes, and verification steps for agent-friendly developer tools.";

export const metadata: Metadata = {
  title: "CLI Guides",
  description: cliPageDescription,
  alternates: {
    canonical: "/cli",
  },
  openGraph: {
    url: absoluteUrl("/cli"),
    title: "CLI Guides | getcli",
    description: cliPageDescription,
    type: "website",
  },
  twitter: {
    title: "CLI Guides | getcli",
    description: cliPageDescription,
  },
};

export default function CliIndexPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${siteName} CLI Guides`,
        description: cliPageDescription,
        url: absoluteUrl("/cli"),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteName,
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "CLI Guides",
            item: absoluteUrl("/cli"),
          },
        ],
      },
    ],
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
          <h1 className="mt-3 text-4xl font-bold tracking-tight">CLI Guides</h1>
          <p className="mt-3 max-w-3xl text-base text-gray-600">
            Every tool in the registry gets an indexable landing page with install instructions,
            prerequisites, auth notes, verification steps, and related tools.
          </p>
        </div>

        <section className="rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">All Tools</h2>
              <p className="mt-2 text-sm text-gray-600">
                {tools.length} install guides are currently published.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/registry" className="text-gray-900 underline underline-offset-4">
                Browse registry filters
              </Link>
              <Link href="/add-cli" className="text-gray-900 underline underline-offset-4">
                Add a CLI
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={`/cli/${tool.id}`}
                className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-400"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{tool.display_name}</p>
                    <p className="mt-1 text-sm text-gray-600">{tool.description}</p>
                  </div>
                  <code className="text-xs text-gray-500">{tool.command}</code>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
