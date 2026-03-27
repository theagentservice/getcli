"use client";

import { useState } from "react";

type CodeBlockProps = {
  code: string;
  className?: string;
};

export default function CodeBlock({ code, className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded border border-white/15 bg-white/10 px-2 py-1 text-xs text-gray-200 transition hover:bg-white/20"
        aria-label="Copy code to clipboard"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 pr-20 text-sm text-green-400">
        <code>{code}</code>
      </pre>
    </div>
  );
}
