"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="rounded-lg border border-cyan-300/35 bg-cyan-400/15 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-400/25"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
