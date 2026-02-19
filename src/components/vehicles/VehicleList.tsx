"use client";

import Link from "next/link";
import { useVehicles } from "@/hooks/useVehicles";
import { VehicleCard } from "./VehicleCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function VehicleList() {
  const { vehicles, loading } = useVehicles();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600 mb-4">No vehicles found.</p>
        <Link href="/vehicles/new" className="text-blue-600 hover:underline">
          Add a new vehicle
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
