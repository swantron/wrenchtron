"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/vehicles", label: "Garage" },
  { href: "/about", label: "About" },
];

import { ThemeToggle } from "./ThemeToggle";

export function NavBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 hidden border-b border-gray-100 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white"
            >
              Wrenchtron
            </Link>
            <div className="flex gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${pathname === link.href
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-6 border-l border-gray-100 pl-4 dark:border-gray-800">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticated</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded-xl bg-gray-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
