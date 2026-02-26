"use client";

import { NavBar } from "./NavBar";
import { MobileNav } from "./MobileNav";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function AppShell({
  children,
  isDemo
}: {
  children: React.ReactNode;
  isDemo?: boolean;
}) {
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
      <NavBar isDemo={isDemo} />
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-semibold text-white">
          You are offline. Changes will sync when reconnected.
        </div>
      )}
      <main className="pb-20 md:pb-0">{children}</main>
      <MobileNav isDemo={isDemo} />
    </div>
  );
}
