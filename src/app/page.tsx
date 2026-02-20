"use client";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { ActionableItems } from "@/components/dashboard/ActionableItems";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useVehicles } from "@/hooks/useVehicles";
import { useActionableItems } from "@/hooks/useActionableItems";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
            Wrenchtron
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              Sign In
            </Link>
          </div>
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
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { items: actionItems, loading: itemsLoading } = useActionableItems(vehicles);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");

  // Re-import useState since it was only in LandingPage scope implicitely or globally?
  // Wait, LandingPage didn't use useState. We need to add it to imports.


  if (loading || vehiclesLoading) {
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
              My Garage
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/50 sm:w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "overview"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "timeline"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
          >
            Timeline
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* Actionable Items Section (Priority items only?) */}
            {/* User asked for breakdown specifically for upcoming maintenance in timeline tab. */}
            {/* Maybe we keep concise list here? Or full list? */}
            {/* Existing behavior: full grid. Let's keep it. */}
            {!itemsLoading && actionItems.length > 0 && (
              <ActionableItems items={actionItems} />
            )}

            <div className="mt-6">
              <DashboardGrid actionItems={actionItems} />
            </div>
          </>
        ) : (
          <TimelineView items={actionItems} />
        )}
      </div>
    </AppShell>
  );
}
