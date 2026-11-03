"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { rememberArea } from "@/lib/homeArea";
import { signOut } from "@/lib/firebase/auth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useFleet } from "./FleetProvider";

const ROLE_LABELS = { owner: "Owner", manager: "Manager", tech: "Tech" } as const;

export function FleetShell({ children }: { children: React.ReactNode }) {
  const { memberships, fleetId, member, setActiveFleet } = useFleet();
  const pathname = usePathname();
  useEffect(() => rememberArea("fleet"), []);
  const nav = [
    { href: "/fleet", label: "Board" },
    { href: "/fleet/team", label: "Team" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/fleet" className="font-semibold tracking-tight text-stone-900 dark:text-white">
              Wrenchtron
            </Link>
            {memberships.length > 1 ? (
              <select
                value={fleetId ?? ""}
                onChange={(e) => setActiveFleet(e.target.value)}
                aria-label="Switch fleet"
                className="min-w-0 truncate rounded border border-stone-300 bg-white px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-900"
              >
                {memberships.map((m) => (
                  <option key={m.fleetId} value={m.fleetId}>
                    {m.fleetName}
                  </option>
                ))}
              </select>
            ) : (
              memberships[0] && (
                <span className="truncate text-sm text-stone-500 dark:text-stone-400">{memberships[0].fleetName}</span>
              )
            )}
            {member && <span className="hidden text-sm text-stone-400 sm:inline">{ROLE_LABELS[member.role]}</span>}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => signOut()}
              className="text-sm text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline dark:text-stone-300 dark:hover:text-white"
            >
              Sign out
            </button>
            <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white" />
          </div>
        </div>
      </header>
      {member && (
        <nav className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
          <div className="mx-auto flex max-w-6xl gap-6 px-4 sm:px-6">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px border-b-2 py-2.5 text-sm ${active
                    ? "border-stone-900 font-medium text-stone-900 dark:border-white dark:text-white"
                    : "border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
