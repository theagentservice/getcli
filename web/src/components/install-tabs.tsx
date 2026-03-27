"use client";

import { useState } from "react";
import CodeBlock from "@/components/code-block";

export type InstallTab = {
  id: string;
  label: string;
  command: string;
};

type InstallTabsProps = {
  items: InstallTab[];
  className?: string;
};

export default function InstallTabs({ items, className = "" }: InstallTabsProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  if (!selected) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const active = item.id === selected.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="min-w-0">
          <CodeBlock code={selected.command} />
        </div>
      </div>
    </div>
  );
}
