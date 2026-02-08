"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVehicles } from "@/hooks/useVehicles";
import { subscribeToMaintenanceLogs } from "@/lib/firebase/firestore";
import {
  MaintenanceSummary,
  computeSummary,
} from "./MaintenanceSummary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";

function DashboardVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);

  useEffect(() => {
    if (!user || !vehicle.id) return;
    const unsub = subscribeToMaintenanceLogs(user.uid, vehicle.id, setLogs);
    return unsub;
  }, [user, vehicle.id]);

  const summary = computeSummary(logs, vehicle.currentMileage);

  return (
    <Link
      href={`/vehicles/detail?id=${vehicle.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {vehicle.name}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {vehicle.currentMileage.toLocaleString()} mi
          </p>
        </div>
      </div>
      <div className="mt-4">
        <MaintenanceSummary summary={summary} />
      </div>
    </Link>
  );
}

export function DashboardGrid() {
  const { vehicles, loading } = useVehicles();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <svg
          className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25a1.125 1.125 0 0 1-1.125-1.125V6.75m18.375 7.5V6.75m0 0a1.125 1.125 0 0 0-1.125-1.125H3.375a1.125 1.125 0 0 0-1.125 1.125m18.375 0V3.375"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          No vehicles yet
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add your first vehicle to start tracking maintenance.
        </p>
        <Link
          href="/vehicles/new"
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <DashboardVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
