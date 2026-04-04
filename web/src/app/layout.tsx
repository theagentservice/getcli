import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist_Mono } from "next/font/google";
import {
  absoluteUrl,
  defaultDescription,
  defaultKeywords,
  defaultTitle,
  organizationName,
  siteName,
  titleTemplate,
} from "@/lib/seo";
import "./globals.css";

config.autoAddCss = false;

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: defaultTitle,
    template: titleTemplate,
  },
  description: defaultDescription,
  applicationName: siteName,
  keywords: defaultKeywords,
  authors: [{ name: organizationName, url: "https://theagentservice.com" }],
  creator: organizationName,
  publisher: organizationName,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();
  const navigationData = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: ["Home", "CLI Guides", "Registry", "Docs", "Agent-Friendly", "Demos"],
    url: [
      absoluteUrl("/"),
      absoluteUrl("/cli"),
      absoluteUrl("/registry"),
      absoluteUrl("/docs"),
      absoluteUrl("/agent-friendly"),
      absoluteUrl("/demos"),
    ],
  };

  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationData) }}
        />
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gray-200 px-4 py-4 sm:px-8">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 font-[family-name:var(--font-geist-mono)] text-sm text-gray-600">
              <Link href="/" className="font-medium text-gray-900">
                getcli
              </Link>
              <nav className="flex flex-wrap items-center gap-4">
                <Link href="/cli" className="transition hover:text-gray-900">
                  CLI Guides
                </Link>
                <Link href="/registry" className="transition hover:text-gray-900">
                  Registry
                </Link>
                <Link href="/docs" className="transition hover:text-gray-900">
                  Docs
                </Link>
                <Link href="/agent-friendly" className="transition hover:text-gray-900">
                  Agent-Friendly
                </Link>
                <Link href="/demos" className="transition hover:text-gray-900">
                  Demos
                </Link>
              </nav>
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-gray-200 px-4 py-6 text-sm text-gray-500 sm:px-8">
            <div className="mx-auto flex max-w-4xl items-center justify-end gap-3 font-[family-name:var(--font-geist-mono)]">
              <span>&copy; {currentYear}</span>
              <span>Built by</span>
              <a
                href="https://theagentservice.com"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-gray-900"
              >
                The Agent Service Company
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
