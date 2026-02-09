"use client";

import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Wrenchtron
        </h1>
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign In
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <svg
          className="mb-6 h-20 w-20 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.194-.14 1.743"
          />
        </svg>
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Vehicle maintenance,
          <br />
          simplified.
        </h2>
        <p className="mt-4 max-w-md text-lg text-gray-600 dark:text-gray-400">
          Track oil changes, tire rotations, brake jobs, and more.
          Know exactly when your next service is due.
        </p>
        <Link
          href="/login"
          className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
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
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <div className="mt-6">
          <DashboardGrid />
        </div>
      </div>
    </AppShell>
  );
}
