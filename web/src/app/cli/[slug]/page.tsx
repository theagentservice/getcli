import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CodeBlock from "@/components/code-block";
import { getToolPageContent } from "@/data/tool-content";
import { getToolById, tools } from "@/data/registry";
import { absoluteUrl, siteName } from "@/lib/seo";
import {
  formatPlatforms,
  installCommand,
  installLabel,
  relatedTools,
  toolPageDescription,
  toolPageTitle,
} from "@/lib/tool-pages";

type ToolPageParams = {
  slug: string;
};

type ToolPageProps = {
  params: Promise<ToolPageParams>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolById(slug);

  if (!tool) {
    return {};
  }

  const description = toolPageDescription(tool);
  const title = toolPageTitle(tool);

  return {
    title,
    description,
    keywords: [
      `${tool.display_name} install`,
      `${tool.command} install`,
      `${tool.display_name} CLI`,
      ...tool.tags,
      "getcli",
    ],
    alternates: {
      canonical: `/cli/${tool.id}`,
    },
    openGraph: {
      url: absoluteUrl(`/cli/${tool.id}`),
      title: `${title} | getcli`,
      description,
      type: "article",
    },
    twitter: {
      title: `${title} | getcli`,
      description,
    },
  };
}

export default async function ToolLandingPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolById(slug);

  if (!tool) {
    notFound();
  }

  const content = getToolPageContent(tool);
  const installCode = [`getcli install ${tool.id} --yes`, `getcli doctor ${tool.id}`].join("\n");
  const examplesCode = tool.examples.join("\n");
  const defaultInstallCommand = installCommand(tool.install_default, tool.install_default_package);
  const related = relatedTools(tool, tools);
  const description = toolPageDescription(tool);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: toolPageTitle(tool),
        description,
        url: absoluteUrl(`/cli/${tool.id}`),
        about: {
          "@type": "SoftwareApplication",
          name: tool.display_name,
          operatingSystem: formatPlatforms(tool.platforms),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
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
            name: "Registry",
            item: absoluteUrl("/registry"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.display_name,
            item: absoluteUrl(`/cli/${tool.id}`),
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen p-8 font-[family-name:var(--font-geist-mono)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/registry" className="text-sm text-gray-500 hover:text-gray-900">
            &larr; Registry
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{toolPageTitle(tool)}</h1>
          <p className="mt-3 text-base text-gray-600">{content.intro}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-gray-100 px-3 py-1">{tool.command}</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">
              {formatPlatforms(tool.platforms)}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1">
              Default via {installLabel(tool.install_default)}
            </span>
            {tool.supports_json && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
                supports --json
              </span>
            )}
          </div>
        </div>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Install and Verify</h2>
          <p className="mt-2 text-sm text-gray-600">
            Use getcli to install {tool.display_name} and verify the binary before you hand it to
            an automation workflow.
          </p>
          <CodeBlock code={installCode} className="mt-4" />
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Why Use getcli for {tool.display_name}?</h2>
          <p className="mt-2 text-sm text-gray-600">{content.whyGetcli}</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {content.useCases.map((useCase) => (
              <li key={useCase} className="rounded-lg bg-gray-50 px-4 py-3">
                {useCase}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Install Options</h2>
            <div className="mt-4 space-y-4 text-sm text-gray-700">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-medium">getcli</p>
                <p className="mt-1 text-gray-600">Unified install path and doctor workflow.</p>
                <code className="mt-3 block text-gray-900">getcli install {tool.id} --yes</code>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-medium">Official default channel</p>
                <p className="mt-1 text-gray-600">
                  {installLabel(tool.install_default)}
                  {tool.install_default_package ? ` package ${tool.install_default_package}` : ""}
                </p>
                {defaultInstallCommand ? (
                  <code className="mt-3 block text-gray-900">{defaultInstallCommand}</code>
                ) : tool.homepage ? (
                  <a
                    href={tool.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-gray-900 underline underline-offset-2"
                  >
                    Open official docs
                  </a>
                ) : null}
              </div>

              {tool.install_alternatives.map((alternative) => {
                const alternativeCommand = installCommand(alternative.type, alternative.package);

                return (
                  <div key={`${alternative.type}-${alternative.package ?? alternative.url ?? ""}`} className="rounded-lg bg-gray-50 p-4">
                    <p className="font-medium">Alternative: {installLabel(alternative.type)}</p>
                    {alternative.note && <p className="mt-1 text-gray-600">{alternative.note}</p>}
                    {alternativeCommand ? (
                      <code className="mt-3 block text-gray-900">{alternativeCommand}</code>
                    ) : alternative.url ? (
                      <a
                        href={alternative.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-gray-900 underline underline-offset-2"
                      >
                        Open alternative install docs
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Prerequisites and Auth</h2>
            <div className="mt-4 space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-medium">Prerequisites</h3>
                {tool.prerequisites.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {tool.prerequisites.map((prerequisite) => (
                      <li key={prerequisite} className="rounded-lg bg-gray-50 px-4 py-3">
                        {prerequisite}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-lg bg-gray-50 px-4 py-3">No extra prerequisites.</p>
                )}
              </div>

              <div>
                <h3 className="font-medium">Auth notes</h3>
                {tool.auth_notes.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {tool.auth_notes.map((note) => (
                      <li key={note} className="rounded-lg bg-gray-50 px-4 py-3">
                        {note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-lg bg-gray-50 px-4 py-3">No auth notes.</p>
                )}
              </div>

              {tool.recommended_version && (
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  Recommended version: <code>{tool.recommended_version}</code>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Example Commands</h2>
          <p className="mt-2 text-sm text-gray-600">
            These are representative commands from the registry manifest for {tool.display_name}.
          </p>
          <CodeBlock code={examplesCode} className="mt-4" />
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-4 space-y-4">
            {content.faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium">{faq.question}</h3>
                <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Related Tools</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {related.map((relatedTool) => (
              <Link
                key={relatedTool.id}
                href={`/cli/${relatedTool.id}`}
                className="rounded-lg bg-gray-50 p-4 transition hover:bg-gray-100"
              >
                <p className="font-medium">{relatedTool.display_name}</p>
                <p className="mt-1 text-sm text-gray-600">{relatedTool.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
