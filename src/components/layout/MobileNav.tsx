"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/vehicles",
    label: "Garage",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/",
    label: "Hub",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/vehicles/new",
    label: "Add",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

import { ThemeToggle } from "./ThemeToggle";

import { useAuth } from "@/hooks/useAuth";

export function MobileNav({ isDemo }: { isDemo?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAuthenticated = isDemo || !!user;

  const filteredItems = navItems.filter(item => {
    if (item.label === "Add" && !isAuthenticated) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/80 pb-6 pt-2 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/80 md:hidden">
      <div className="flex items-center justify-around px-4">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-black uppercase tracking-widest transition-all ${pathname === item.href
              ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
          >
            <div className={`p-1 ${pathname === item.href ? "scale-110" : "scale-100"} transition-transform`}>
              {item.icon}
            </div>
            {item.label}
          </Link>
        ))}
        <div className="flex flex-1 flex-col items-center justify-center py-2">
          <ThemeToggle />
          <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Theme</span>
        </div>
      </div>
    </nav>
  );
}
