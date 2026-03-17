"use client";

import { useVehicles } from "@/hooks/useVehicles";
import { useActionableItems } from "@/hooks/useActionableItems";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { VehicleCard } from "./VehicleCard";
import Link from "next/link";

export function VehicleList({ archived = false }: { archived?: boolean }) {
  const { vehicles, loading } = useVehicles({ archived });
  const { items: actionItems } = useActionableItems(archived ? [] : vehicles);

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
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {archived ? "No archived vehicles" : "Garage is empty"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {archived
            ? "Archive a vehicle when you no longer own it to keep history without cluttering your garage."
            : "Add your first vehicle to start tracking maintenance."}
        </p>
        <Link
          href={archived ? "/vehicles" : "/vehicles/new"}
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {archived ? "Back to Garage" : "Add to Garage"}
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
          layout="garage"
          showUnarchive={archived}
        />
      ))}
    </div>
  );
}

