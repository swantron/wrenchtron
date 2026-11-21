"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { MaintenanceHubOverview } from "@/components/dashboard/MaintenanceHubOverview";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useVehicles } from "@/hooks/useVehicles";
import { useActionableItems } from "@/hooks/useActionableItems";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function HubPage() {
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { items: actionItems } = useActionableItems(vehicles);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");

  return (
    <ProtectedRoute>
      {vehiclesLoading ? (
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <AppShell>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                  Maintenance Hub
                </h1>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                  What&apos;s due
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/50 sm:w-fit">
              <button
                onClick={() => setActiveTab("overview")}
                className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-bold transition-all ${
                  activeTab === "overview"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-bold transition-all ${
                  activeTab === "timeline"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Timeline
              </button>
            </div>

            {activeTab === "overview" ? (
              <MaintenanceHubOverview actionItems={actionItems} />
            ) : (
              <TimelineView items={actionItems} />
            )}

            <Link
              href="/vehicles/new"
              className="mt-10 inline-flex min-h-11 items-center rounded-2xl border border-gray-200 px-6 text-sm font-bold text-gray-700 hover:border-blue-200 hover:text-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:text-white"
            >
              Add to Garage
            </Link>
          </div>
        </AppShell>
      )}
    </ProtectedRoute>
  );
}
