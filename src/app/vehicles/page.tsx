"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { VehicleList } from "@/components/vehicles/VehicleList";

export default function VehiclesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vehicles
            </h1>
            <Link
              href="/vehicles/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
