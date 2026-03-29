import type { Tool } from "@/data/registry";

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolPageContent {
  intro: string;
  whyGetcli: string;
  useCases: string[];
  faqs: ToolFaq[];
}

const toolPageContent: Record<string, ToolPageContent> = {
  aws: {
    intro:
      "AWS CLI is the default control surface for S3, IAM, Lambda, ECS, CloudFormation, and most day-to-day cloud automation.",
    whyGetcli:
      "getcli gives you one install path, one verification path, and one place to document auth expectations before an agent starts touching cloud resources.",
    useCases: [
      "Check AWS identity and profile wiring before infrastructure changes.",
      "Run S3, EC2, and IAM inspection commands in scripted workflows.",
      "Standardize CLI setup for teams switching between local credentials and SSO.",
    ],
    faqs: [
      {
        question: "When should I use getcli instead of pipx or the AWS installer?",
        answer:
          "Use getcli when you want discovery, installation, and doctor checks in one workflow. Use the official installer only when your environment already standardizes on it.",
      },
      {
        question: "What usually breaks first after install?",
        answer:
          "Authentication. Most failures come from missing profiles, expired SSO sessions, or unset AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
      },
    ],
  },
  docker: {
    intro:
      "Docker CLI is still the default entry point for local container builds, image inspection, Compose workflows, and registry authentication.",
    whyGetcli:
      "getcli makes Docker installation explicit and keeps the verification step close to the install step, which matters when agents depend on a working daemon and stable command output.",
    useCases: [
      "Bootstrap a container build environment on a clean machine.",
      "Verify Docker is installed before running `docker build`, `docker compose`, or CI smoke tests.",
      "Keep developer laptops and ephemeral workstations on one installation path.",
    ],
    faqs: [
      {
        question: "Does installing the Docker CLI mean Docker is ready to use?",
        answer:
          "Not always. The CLI can be installed while the Docker daemon is unavailable. That is why verification matters.",
      },
      {
        question: "Why not just send developers to Docker Desktop?",
        answer:
          "That works for humans, but it is not a unified workflow. getcli is better when you want a repeatable install command across multiple tools.",
      },
    ],
  },
  firebase: {
    intro:
      "Firebase CLI covers Hosting, Functions, emulators, project selection, and local development workflows for Firebase-based apps.",
    whyGetcli:
      "Firebase often sits in broader deployment pipelines. getcli keeps installation, auth notes, and verification next to the rest of your CLI estate instead of leaving Firebase as a one-off npm dependency.",
    useCases: [
      "Prepare a laptop or CI runner for `firebase deploy` and emulator workflows.",
      "Standardize how Node-based CLIs are installed across multiple projects.",
      "Reduce setup friction before handing a Firebase task to an agent.",
    ],
    faqs: [
      {
        question: "Do I still need Node if I install Firebase through getcli?",
        answer:
          "Yes. getcli installs the CLI, but the Firebase toolchain still depends on Node for the npm-based distribution path.",
      },
      {
        question: "What auth method should I expect?",
        answer:
          "Interactive work usually starts with `firebase login`. CI often uses `firebase login:ci` or a service account-based flow depending on the setup.",
      },
    ],
  },
  fly: {
    intro:
      "Fly.io CLI is used to deploy apps, inspect machines, stream logs, and manage a globally distributed Fly deployment from the terminal.",
    whyGetcli:
      "Fly is often part of a larger deploy toolchain with Docker, GitHub, and cloud CLIs. getcli makes it another managed dependency instead of a separate install path.",
    useCases: [
      "Set up a fresh machine for `fly deploy` and `fly status --json`.",
      "Verify the CLI before running deploy or incident response workflows.",
      "Keep platform tooling consistent across contractors, teammates, and agents.",
    ],
    faqs: [
      {
        question: "Is Fly CLI agent-friendly?",
        answer:
          "Yes. It exposes structured output for several commands and fits well into scripted deployment workflows.",
      },
      {
        question: "What is the usual blocker after install?",
        answer:
          "Authentication and app context. `fly auth login` and selecting the right app or organization usually come first.",
      },
    ],
  },
  github: {
    intro:
      "GitHub CLI is the fastest way to script pull requests, issues, releases, repo operations, and auth-aware GitHub workflows from a terminal.",
    whyGetcli:
      "getcli is useful when GitHub CLI is only one of many tools an agent needs. You get one install surface, one registry, and one verification path instead of scattered vendor-specific docs.",
    useCases: [
      "Set up `gh` quickly before repo, PR, or release automation work.",
      "Verify GitHub CLI presence before agent-driven issue triage and code review flows.",
      "Keep local and ephemeral machines aligned on the same installation path.",
    ],
    faqs: [
      {
        question: "Can I use GitHub CLI without logging in?",
        answer:
          "Some public read operations work unauthenticated, but most useful repo and PR workflows need `gh auth login` or a token.",
      },
      {
        question: "Why create a dedicated landing page for GitHub CLI?",
        answer:
          "Search intent is specific. People do not search for a generic installer when they want to install GitHub CLI. They search for GitHub CLI directly.",
      },
    ],
  },
  kubectl: {
    intro:
      "kubectl remains the default interface for Kubernetes cluster inspection, rollout control, debugging, and object management.",
    whyGetcli:
      "Kubernetes workflows break down quickly when machines have missing or stale tooling. getcli makes `kubectl` installable and verifiable inside the same workflow as the rest of your infra tooling.",
    useCases: [
      "Bootstrap a workstation for cluster inspection and deployment rollout tasks.",
      "Verify `kubectl` before running scripted maintenance or support procedures.",
      "Document kubeconfig expectations next to the install path.",
    ],
    faqs: [
      {
        question: "Does installing kubectl also configure cluster access?",
        answer:
          "No. Installation only gives you the binary. You still need a valid kubeconfig and provider-specific credentials.",
      },
      {
        question: "Why not rely on cloud-specific installers?",
        answer:
          "Those installers solve one part of the problem. getcli is better when you want one standard install interface across the whole toolchain.",
      },
    ],
  },
  netlify: {
    intro:
      "Netlify CLI is commonly used for local preview, deploys, functions, and project management in Netlify-hosted web workflows.",
    whyGetcli:
      "Netlify is typically one item in a broader frontend tool stack. getcli keeps the install path discoverable and consistent with the rest of your deployment tooling.",
    useCases: [
      "Prepare a machine for `netlify deploy --prod` and local dev flows.",
      "Verify Netlify CLI before handing deploy steps to an agent.",
      "Keep Node-based deployment CLIs installed through one standard workflow.",
    ],
    faqs: [
      {
        question: "Should I use npm or Homebrew for Netlify CLI?",
        answer:
          "Either works. The point of getcli is that you do not need to decide ad hoc on every machine.",
      },
      {
        question: "What auth setup should I expect?",
        answer:
          "Interactive use typically starts with `netlify login`. CI commonly uses `NETLIFY_AUTH_TOKEN`.",
      },
    ],
  },
  railway: {
    intro:
      "Railway CLI handles deploys, status checks, logs, and project operations for Railway-hosted services and databases.",
    whyGetcli:
      "Railway is often installed opportunistically. getcli turns it into a managed dependency with consistent install, inspect, and verify steps.",
    useCases: [
      "Get a clean machine ready for `railway up` and environment inspection.",
      "Verify Railway CLI before scripted deployment or debugging work.",
      "Keep platform tooling consistent across multiple PaaS providers.",
    ],
    faqs: [
      {
        question: "When is the npm alternative useful?",
        answer:
          "It helps when your environment already standardizes on Node-based tooling. Otherwise the managed default path is simpler.",
      },
      {
        question: "What normally fails after install?",
        answer:
          "Authentication or project context. `railway login` and selecting the right linked project are the common next steps.",
      },
    ],
  },
  stripe: {
    intro:
      "Stripe CLI is essential for webhook testing, local event replay, and payment integration development without waiting on live dashboard flows.",
    whyGetcli:
      "Stripe often appears in app onboarding or integration debugging. getcli reduces setup friction when an agent or teammate needs the CLI immediately and does not want to hunt for vendor docs.",
    useCases: [
      "Set up webhook testing on a new machine.",
      "Verify Stripe CLI before local payment integration work.",
      "Keep fintech-related tooling discoverable in a central CLI registry.",
    ],
    faqs: [
      {
        question: "Do I need a browser login or an API key?",
        answer:
          "Either can work depending on your flow. Interactive work often starts with `stripe login`, while automation may use `STRIPE_API_KEY`.",
      },
      {
        question: "Why is Stripe CLI worth a dedicated page?",
        answer:
          "Because install intent is specific and high-value. The people searching for it are already close to integration work.",
      },
    ],
  },
  supabase: {
    intro:
      "Supabase CLI covers local dev, database migrations, auth, edge functions, and project management for Supabase-backed apps.",
    whyGetcli:
      "Supabase is a good example of a tool that looks easy to install until teams end up mixing brew, npm, and release binaries. getcli gives you one canonical path and a verification step.",
    useCases: [
      "Prepare a machine for `supabase db push` and functions deploys.",
      "Standardize install and doctor flows for backend-focused agents.",
      "Keep database, auth, and serverless tooling visible in one registry.",
    ],
    faqs: [
      {
        question: "Is Homebrew the only way to install Supabase CLI?",
        answer:
          "No. The registry also tracks npm and binary alternatives, but getcli gives you one stable interface over those choices.",
      },
      {
        question: "What auth setup should I expect?",
        answer:
          "Interactive sessions usually start with `supabase login`. CI often uses `SUPABASE_ACCESS_TOKEN`.",
      },
    ],
  },
  terraform: {
    intro:
      "Terraform CLI is still the default interface for plan, apply, state inspection, and infrastructure workflows across major cloud providers.",
    whyGetcli:
      "Terraform tends to live beside AWS, kubectl, Docker, and platform CLIs. getcli gives you a single installation and verification workflow across that whole stack.",
    useCases: [
      "Bootstrap a workstation for plan and apply workflows.",
      "Verify the CLI before running infrastructure automation or drift checks.",
      "Standardize Terraform setup across local and ephemeral environments.",
    ],
    faqs: [
      {
        question: "Does installing Terraform also configure cloud access?",
        answer:
          "No. Terraform still depends on provider credentials and backend configuration after the binary is installed.",
      },
      {
        question: "Why use getcli if Terraform already has clear install docs?",
        answer:
          "Because installation is only one tool-specific step. getcli is valuable when you want one cross-tool workflow instead of separate vendor instructions for everything.",
      },
    ],
  },
  turso: {
    intro:
      "Turso CLI manages edge SQLite databases, shells into libSQL-backed instances, and supports the operational side of Turso projects.",
    whyGetcli:
      "Turso is exactly the kind of niche-but-important CLI that benefits from a registry page. It is easy to forget until you need it, and then setup speed matters.",
    useCases: [
      "Prepare a machine for Turso database creation and inspection.",
      "Verify the CLI before scripting database lifecycle commands.",
      "Keep database tooling centralized with the rest of your developer platform tools.",
    ],
    faqs: [
      {
        question: "Why not just link to Turso docs?",
        answer:
          "Vendor docs are still useful, but a landing page inside getcli creates searchable context around install, verification, and related tooling.",
      },
      {
        question: "What comes right after install?",
        answer:
          "Usually `turso auth login`, followed by creating or selecting the database you want to work with.",
      },
    ],
  },
  vercel: {
    intro:
      "Vercel CLI is the standard path for local linking, deploy previews, environment management, and project operations on Vercel.",
    whyGetcli:
      "Vercel is a high-intent install term. A dedicated page lets getcli rank on those specific searches while still giving users a unified installer instead of another standalone npm step.",
    useCases: [
      "Set up preview and production deploy workflows on a new machine.",
      "Verify the Vercel CLI before agent-driven deployment or environment changes.",
      "Standardize frontend platform tooling with the rest of your CLI stack.",
    ],
    faqs: [
      {
        question: "Why does Vercel CLI usually install through npm?",
        answer:
          "That is the vendor-default distribution. getcli keeps the interface stable even when the underlying package manager differs from other tools.",
      },
      {
        question: "What should I do after install?",
        answer:
          "Run `vercel login` and link the right project or team context before deploy commands.",
      },
    ],
  },
  wrangler: {
    intro:
      "Wrangler is the operational CLI for Cloudflare Workers, assets, bindings, and deployment workflows.",
    whyGetcli:
      "Wrangler is a strong SEO target because installation intent is specific and recurring. getcli adds a consistent install and verification workflow around a tool that many teams otherwise install ad hoc through npm.",
    useCases: [
      "Prepare a machine for Cloudflare Workers development and deployment.",
      "Verify Wrangler before pushing infra changes or static asset deploys.",
      "Standardize Node-based cloud CLIs alongside other platform tools.",
    ],
    faqs: [
      {
        question: "Do I need Node to use Wrangler?",
        answer:
          "Yes. Wrangler is distributed through npm, so Node is part of the expected environment.",
      },
      {
        question: "What auth path should I expect?",
        answer:
          "Interactive use generally starts with `wrangler login`. CI and automation often use `CLOUDFLARE_API_TOKEN`.",
      },
    ],
  },
};

export const featuredToolIds = [
  "github",
  "docker",
  "kubectl",
  "terraform",
  "vercel",
  "wrangler",
];

export function getToolPageContent(tool: Tool): ToolPageContent {
  return (
    toolPageContent[tool.id] ?? {
      intro: `${tool.display_name} is a commonly used CLI for ${tool.tags.slice(0, 2).join(" and ")} workflows.`,
      whyGetcli:
        "getcli keeps installation, discovery, and verification in one place instead of forcing every tool to have its own setup path.",
      useCases: [
        `Install ${tool.display_name} on a new machine quickly.`,
        `Verify ${tool.command} before running automation.`,
        `Keep ${tool.display_name} documented inside a shared CLI registry.`,
      ],
      faqs: [
        {
          question: `Why install ${tool.display_name} with getcli?`,
          answer:
            "Because the install flow stays consistent across multiple tools, which reduces setup drift across local machines, CI runners, and agents.",
        },
      ],
    }
  );
}
