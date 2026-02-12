"use client";

import { NavBar } from "./NavBar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
      <NavBar />
      <main className="pb-20 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
