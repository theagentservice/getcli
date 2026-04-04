"use client";

import Link from "next/link";
import { useState } from "react";
import { tools, allTags } from "@/data/registry";

export default function RegistryPage() {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filtered = tools.filter((t) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.display_name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.command.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q));

    const matchesTag = !selectedTag || t.tags.includes(selectedTag);

    return matchesQuery && matchesTag;
  });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 font-[family-name:var(--font-geist-mono)]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">
            &larr; getcli
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Registry</h1>
          <p className="text-gray-600 mt-1">{tools.length} CLI tools available</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <select
            value={selectedTag || ""}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filtered.map((tool) => (
            <div
              key={tool.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-lg">
                    <Link href={`/cli/${tool.id}`} className="hover:underline underline-offset-4">
                      {tool.display_name}
                    </Link>
                    <code className="ml-2 text-sm text-gray-500 font-normal">{tool.command}</code>
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{tool.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-4">
                  {tool.agent_friendly && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                      agent-friendly
                    </span>
                  )}
                  {tool.supports_json && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      --json
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {tool.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="mt-3 bg-gray-50 rounded p-3 text-sm">
                <code className="text-gray-500">getcli install {tool.id} --yes</code>
                <span className="text-gray-400 ml-4">via {tool.install_default}</span>
              </div>

              <div className="mt-3">
                <Link
                  href={`/cli/${tool.id}`}
                  className="text-sm text-gray-900 underline underline-offset-4"
                >
                  Open landing page
                </Link>
              </div>

              {tool.examples.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  {tool.examples.map((ex, i) => (
                    <code key={i} className="block">
                      $ {ex}
                    </code>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-12">No tools match your search.</p>
          )}
        </div>
      </div>
    </main>
  );
}
