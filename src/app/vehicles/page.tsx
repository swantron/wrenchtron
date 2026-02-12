"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { VehicleList } from "@/components/vehicles/VehicleList";

export default function VehiclesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Vehicles
              </h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Garage
              </p>
            </div>
            <Link
              href="/vehicles/new"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
            >
              Add Vehicle
            </Link>
          </div>
          <div className="mt-6">
            <VehicleList />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
