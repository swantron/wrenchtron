"use client";

import Link from "next/link";
import { useVehicles } from "@/hooks/useVehicles";
import { VehicleCard } from "./VehicleCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function VehicleList() {
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
      <div className="py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No vehicles yet. Add your first vehicle to get started.
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
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
