import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteName } from "@/lib/seo";

const pageDescription =
  "Three shareable getcli demos for developer growth: agent bootstrap, cross-ecosystem installs, and doctor catching bad environments.";

const demos = [
  {
    label: "Demo 01",
    title: "Agent boots itself",
    summary:
      "Start with a blank shell, discover the missing tool, install it, and verify the environment without hand-holding.",
    transcript: `$ getcli doctor
Doctor: environment
  path: configured
  installers: brew, npm, pnpm, cargo, uv, bun
  status: OK

$ getcli search github
github  GitHub CLI
  official repo: github.com/cli/cli
  install channels: brew, npm, binary

$ getcli install github --yes
Installing github ...
Done.

$ getcli doctor github
Doctor: github
  status: OK`,
    takeaway: "This is the story that sells getcli fastest: discover, install, verify, continue.",
  },
  {
    label: "Demo 02",
    title: "Cross-ecosystem install",
    summary:
      "One command surface across brew, npm, cargo, and direct binary installs. Agents do not have to remember vendor-specific syntax.",
    transcript: `$ getcli install stripe --yes
Selected channel: npm
Installing @stripe/stripe-cli ...
Done.

$ getcli install terraform --yes
Selected channel: direct binary
Downloading terraform ...
Done.

$ getcli install feishu --yes
Selected channel: npm
Installing @larksuite/cli ...
Done.`,
    takeaway: "One interface, many ecosystems. That is easier to automate and easier to explain.",
  },
  {
    label: "Demo 03",
    title: "Doctor catches bad env",
    summary:
      "When the machine is broken, getcli tells you exactly what is missing before the agent burns time on a bad assumption.",
    transcript: `$ PATH=/tmp/empty getcli doctor
Doctor: environment
  path: missing
  installers:
    - brew: no
    - npm: no
    - pnpm: no
    - cargo: no
    - uv: no
    - bun: no
  status: action required

$ getcli doctor github --json
{
  "status": "missing",
  "reason": "github CLI not installed"
}`,
    takeaway: "This is the reliability demo: it surfaces bad state early instead of failing downstream.",
  },
] as const;

export const metadata: Metadata = {
  title: "Demos",
  description: pageDescription,
  alternates: {
    canonical: "/demos",
  },
  openGraph: {
    url: absoluteUrl("/demos"),
    title: "Demos | getcli",
    description: pageDescription,
    type: "website",
  },
  twitter: {
    title: "Demos | getcli",
    description: pageDescription,
  },
};

function Transcript({ text }: { text: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-50 shadow-sm">
      <code className="whitespace-pre-wrap">{text}</code>
    </pre>
  );
}

export default function DemosPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Demos`,
    description: pageDescription,
    url: absoluteUrl("/demos"),
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 font-[family-name:var(--font-geist-mono)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            &larr; Home
          </Link>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              Shareable demos
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Three terminal demos that explain getcli in one screenshot.
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-600">
              These are the stories that travel well: an agent bootstrapping itself, a single
              install surface across ecosystems, and a doctor command that catches a broken
              machine before the workflow falls apart.
            </p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          {demos.map((demo) => (
            <article
              key={demo.title}
              className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">
                  {demo.label}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
                  {demo.title}
                </h2>
                <p className="text-sm leading-6 text-gray-600">{demo.summary}</p>
              </div>

              <div className="mt-5">
                <Transcript text={demo.transcript} />
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-950">Why it works</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">{demo.takeaway}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight">Use these demos everywhere</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                They are short enough for a README, clear enough for a launch post, and concrete
                enough for an agent to understand without guessing.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/cli"
                className="rounded-full border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:border-gray-500"
              >
                Browse CLI guides
              </Link>
              <Link
                href="/agent-friendly"
                className="rounded-full border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:border-gray-500"
              >
                See the rubric
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
