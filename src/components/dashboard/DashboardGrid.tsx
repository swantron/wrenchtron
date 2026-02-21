"use client";

import { useVehicles } from "@/hooks/useVehicles";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import Link from "next/link";
import type { ActionItem } from "@/utils/maintenance";
import type { Vehicle } from "@/types/firestore";

export function DashboardGrid({
  actionItems,
  vehicles: initialVehicles,
  onVehicleClick,
  layout = "dashboard",
  isDemo,
}: {
  actionItems: ActionItem[];
  vehicles?: Vehicle[];
  onVehicleClick?: (v: Vehicle) => void;
  layout?: "dashboard" | "garage";
  isDemo?: boolean;
}) {
  const { vehicles: fetchedVehicles, loading: hookLoading } = useVehicles();

  const vehicles = initialVehicles || fetchedVehicles;
  const loading = initialVehicles ? false : hookLoading;

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
          Garage is empty
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add your first vehicle to start tracking maintenance.
        </p>
        <Link
          href={isDemo ? "/login" : "/vehicles/new"}
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {isDemo ? "Sign Up Free" : "Add to Garage"}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          items={actionItems.filter((i) => i.vehicleId === vehicle.id)}
          layout={layout}
          isDemo={isDemo}
          onClick={onVehicleClick ? () => onVehicleClick(vehicle) : undefined}
        />
      ))}
    </div>
  );
}

