"use client";

import Link from "next/link";
import type { Vehicle } from "@/types/firestore";

const typeLabels: Record<string, string> = {
  car: "Car",
  truck: "Truck",
  motorcycle: "Motorcycle",
  atv: "ATV",
  suv: "SUV",
  van: "Van",
  other: "Other",
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/vehicles/detail?id=${vehicle.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {vehicle.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {typeLabels[vehicle.type] || vehicle.type}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{vehicle.currentMileage.toLocaleString()} mi</span>
        {vehicle.engine && <span>{vehicle.engine}</span>}
      </div>
      {!vehicle.isActive && (
        <span className="mt-2 inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Inactive
        </span>
      )}
    </Link>
  );
}
