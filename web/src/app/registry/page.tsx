import type { Metadata } from "next";
import RegistryPage from "@/components/registry-page";
import { absoluteUrl, siteName } from "@/lib/seo";

const registryDescription =
  "Browse the curated getcli registry of agent-friendly CLI tools, searchable by capability, tag, and command.";

export const metadata: Metadata = {
  title: "Registry",
  description: registryDescription,
  alternates: {
    canonical: "/registry",
  },
  openGraph: {
    url: absoluteUrl("/registry"),
    title: "Registry | getcli",
    description: registryDescription,
  },
  twitter: {
    title: "Registry | getcli",
    description: registryDescription,
  },
};

export default function RegistryRoute() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Registry`,
    description: registryDescription,
    url: absoluteUrl("/registry"),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <RegistryPage />
    </>
  );
}
