"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { MaintenanceHubOverview } from "@/components/dashboard/MaintenanceHubOverview";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useVehicles } from "@/hooks/useVehicles";
import { useActionableItems } from "@/hooks/useActionableItems";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function HubPage() {
  const { user, loading } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { items: actionItems } = useActionableItems(vehicles);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");

  if (loading || vehiclesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Maintenance Hub
              </h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Upcoming Schedule
              </p>
            </div>
            <Link
              href="/vehicles/new"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
            >
              Add to Garage
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/50 sm:w-fit">
            <button
              onClick={() => setActiveTab("overview")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
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
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
