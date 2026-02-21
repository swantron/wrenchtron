"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/vehicles", label: "Garage" },
  { href: "/", label: "Maintenance Hub" },
  { href: "/about", label: "About" },
];

export function NavBar({ isDemo }: { isDemo?: boolean }) {
  const { user: authUser } = useAuth();
  const user = isDemo ? { displayName: "Demo User", email: "demo@wrenchtron.com" } : authUser;
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 hidden border-b border-gray-100 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link
              href={user ? "/vehicles" : "/"}
              className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white"
            >
              Wrenchtron
            </Link>
            <div className="flex gap-1">
              {navLinks.map((link) => {
                const href = isDemo
                  ? link.href === "/vehicles"
                    ? "/demo?tab=garage"
                    : link.href === "/"
                      ? "/demo?tab=hub"
                      : link.href
                  : link.href;

                return (
                  <Link
                    key={link.href}
                    href={href}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${pathname === link.href || (isDemo && pathname === "/demo" && link.href === "/vehicles")
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user && (
              <Link
                href={isDemo ? "/login" : "/vehicles/new"}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add to Garage
              </Link>
            )}
            {user && (
              <div className="flex items-center gap-6 border-l border-gray-100 pl-4 dark:border-gray-800">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticated</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={() => isDemo ? (window.location.href = "/login") : signOut()}
                  className="rounded-xl bg-gray-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  {isDemo ? "Sign Up" : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
