"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { VehicleList } from "@/components/vehicles/VehicleList";

export default function ArchivedVehiclesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Archived
              </h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Vehicles you no longer own — history preserved
              </p>
            </div>
            <Link
              href="/vehicles"
              className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back to Garage
            </Link>
          </div>
          <div className="mt-6">
            <VehicleList archived />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
