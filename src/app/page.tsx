import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HomeRedirect } from "@/components/home/HomeRedirect";

const TITLE = "Maintenance log for your vehicles and a small fleet — Wrenchtron";
const DESCRIPTION =
  "A maintenance log for the truck, the mower, and a small fleet of vans. See what's due, try the demo, and start on your own.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://wrenchtron.com/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://wrenchtron.com/",
    siteName: "Wrenchtron",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-gray-950">
      <HomeRedirect />
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
            <Logo className="h-9 w-9" />
            Wrenchtron
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-6 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Logo className="mb-12 h-28 w-28" />
        <h1 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white sm:text-7xl">
          Know what&apos;s due
          <br />
          <span className="text-blue-600">on everything you own.</span>
        </h1>
        <p className="mt-8 max-w-xl text-xl font-medium leading-relaxed text-gray-500 dark:text-gray-400">
          A maintenance log for the truck in the driveway and the mower in the shed.
          Oil, tires, and the seasonal jobs. The overdue work comes first.
        </p>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
          Try the sample garage, or start your own. No call.
        </p>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-2xl bg-blue-600 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95"
          >
            Get Started
          </Link>
          <Link
            href="/demo"
            className="rounded-2xl border border-gray-200 bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-50 hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 active:scale-95"
          >
            View Demo
          </Link>
        </div>
        <Link
          href="/demo/fleet"
          className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline dark:text-gray-200 dark:hover:text-white"
        >
          Running vans? See what was done to every one of them →
        </Link>

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3b82f610,transparent)]" />
        </div>
      </main>
    </div>
  );
}
