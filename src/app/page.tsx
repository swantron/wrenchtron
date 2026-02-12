"use client";

import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
            Wrenchtron
          </h1>
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="relative mb-12">
          <div className="absolute -inset-4 rounded-full bg-blue-500/10 blur-2xl" />
          <svg
            className="relative h-24 w-24 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.194-.14 1.743"
            />
          </svg>
        </div>
        <h2 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white sm:text-7xl">
          Vehicle intelligence,
          <br />
          <span className="text-blue-600">reimagined.</span>
        </h2>
        <p className="mt-8 max-w-xl text-xl font-medium leading-relaxed text-gray-500 dark:text-gray-400">
          Keep track of every oil change, tire rotation, and brake job.
          Know exactly when your next service is due.
        </p>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-2xl bg-blue-600 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95"
          >
            Start Your Fleet
          </Link>
          <Link
            href="/demo"
            className="rounded-2xl border border-gray-200 bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-50 hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 active:scale-95"
          >
            View Demo
          </Link>
        </div>

        {/* Decorative Grid Background */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3b82f610,transparent)]" />
          <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] dark:invert" />
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Fleet Intelligence Overview
            </p>
          </div>
        </div>
        <div className="mt-6">
          <DashboardGrid />
        </div>
      </div>
    </AppShell>
  );
}
