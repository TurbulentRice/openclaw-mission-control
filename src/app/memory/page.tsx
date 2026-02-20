"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

interface MemoryDoc {
  id: string;
  title: string;
  filePath: string;
  updatedAtMs: number;
  content: string;
}

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<MemoryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(q?: string) {
    const params = new URLSearchParams();
    if (q?.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/memory${params.toString() ? `?${params.toString()}` : ""}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (json.ok) setDocs(json.docs as MemoryDoc[]);
    setLoading(false);
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const t = setTimeout(() => {
      void load(query);
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const resultLabel = useMemo(() => {
    if (loading) return "Loading memories...";
    return `${docs.length} memory document${docs.length === 1 ? "" : "s"}`;
  }, [docs.length, loading]);

  return (
    <AppShell>
      <section className="space-y-4">
        <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <h2 className="text-2xl font-semibold">Memory</h2>
          <p className="mt-1 text-sm text-slate-300">Search and browse memory documents from your OpenClaw workspace.</p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none ring-cyan-300/40 placeholder:text-slate-400 focus:ring"
            />
            <span className="text-xs text-slate-300 sm:whitespace-nowrap">{resultLabel}</span>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3">
            {docs.map((doc) => (
              <article key={doc.id} className="rounded-xl border border-white/10 bg-[#101a2d] p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{doc.title}</h3>
                    <p className="text-xs text-slate-400">{doc.filePath}</p>
                  </div>
                  <span className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-300">
                    {new Date(doc.updatedAtMs).toLocaleString()}
                  </span>
                </div>

                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-200">
                  {doc.content}
                </pre>
              </article>
            ))}

            {!loading && docs.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                No matching memories found.
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
