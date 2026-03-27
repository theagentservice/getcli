import type { Metadata } from "next";
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

  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-gray-200 px-8 py-6 text-sm text-gray-500">
            <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 font-[family-name:var(--font-geist-mono)]">
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
