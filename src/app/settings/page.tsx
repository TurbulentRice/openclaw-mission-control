"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function SettingsPage() {
  const [operatorNickname, setOperatorNickname] = useState("Operator");
  const [agentNickname, setAgentNickname] = useState("Agent");
  const [openclawWorkspaceDir, setOpenclawWorkspaceDir] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setOperatorNickname(json.settings.operatorNickname);
        setAgentNickname(json.settings.agentNickname);
        setOpenclawWorkspaceDir(json.settings.openclawWorkspaceDir ?? "");
      }
    })();
  }, []);

  async function save() {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorNickname, agentNickname, openclawWorkspaceDir }),
    });
    const json = await res.json();
    if (json.ok) {
      setOperatorNickname(json.settings.operatorNickname);
      setAgentNickname(json.settings.agentNickname);
      setOpenclawWorkspaceDir(json.settings.openclawWorkspaceDir ?? "");
      setSavedAt(new Date().toLocaleTimeString());
    }
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="mt-1 text-sm text-slate-300">Configure app-wide names and preferences.</p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-300">Operator nickname</span>
              <input
                value={operatorNickname}
                onChange={(e) => setOperatorNickname(e.target.value)}
                className="w-full rounded border border-white/15 bg-black/20 px-3 py-2"
                placeholder="Operator"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-300">Agent nickname</span>
              <input
                value={agentNickname}
                onChange={(e) => setAgentNickname(e.target.value)}
                className="w-full rounded border border-white/15 bg-black/20 px-3 py-2"
                placeholder="Agent"
              />
            </label>
          </div>

          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-slate-300">OpenClaw workspace directory</span>
            <input
              value={openclawWorkspaceDir}
              onChange={(e) => setOpenclawWorkspaceDir(e.target.value)}
              className="w-full rounded border border-white/15 bg-black/20 px-3 py-2"
              placeholder="~/.openclaw/workspace"
            />
            <span className="mt-1 block text-xs text-slate-400">Used by Memory screen and other local workspace features.</span>
          </label>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              className="rounded bg-cyan-400/20 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/30"
            >
              Save Settings
            </button>
            {savedAt ? <span className="text-xs text-slate-400">Saved at {savedAt}</span> : null}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
