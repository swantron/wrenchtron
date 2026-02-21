"use client";

import { NavBar } from "./NavBar";
import { MobileNav } from "./MobileNav";

export function AppShell({
  children,
  isDemo
}: {
  children: React.ReactNode;
  isDemo?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
      <NavBar isDemo={isDemo} />
      <main className="pb-20 md:pb-0">{children}</main>
      <MobileNav isDemo={isDemo} />
    </div>
  );
}
