"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Radar, CalendarClock, Activity, ListTodo, SlidersHorizontal } from "lucide-react";

const navItems = [
  { label: "Overview", href: "/", icon: Radar },
  { label: "Timeline", href: "/timeline", icon: Activity },
  { label: "Calendar", href: "/calendar", icon: CalendarClock },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Settings", href: "/settings", icon: SlidersHorizontal },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#102640_0%,_#0b1220_45%,_#070b14_100%)] text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-[1800px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="self-start rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
          <div className="mb-6">
            <div className="mb-1 flex items-center gap-2">
              <Image src="/icon/claw-mc-32.png" alt="Mission Control icon" width={24} height={24} className="rounded" />
              <h1 className="text-2xl font-semibold">Mission Control</h1>
            </div>
            <p className="text-xs text-cyan-300/80">Operator command deck</p>
          </div>
          <nav className="space-y-2">
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100"
                      : "border-transparent text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-400/5"
                  }`}
                >
                  <Icon size={16} className="text-cyan-300" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-6 text-xs text-slate-400">
            Localhost-only control plane for proactive orchestration.
          </p>
        </aside>

        <main className="min-h-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
