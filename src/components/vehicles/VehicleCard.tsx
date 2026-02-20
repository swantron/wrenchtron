"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReceiptURL } from "@/lib/firebase/storage";
import type { Vehicle } from "@/types/firestore";
import { VEHICLE_TYPE_LABELS, formatMileage } from "@/utils/vehicleUtils";



function VehiclePhoto({ photoPath }: { photoPath: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReceiptURL(photoPath).then((u) => {
      if (!cancelled) setUrl(u);
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [photoPath]);

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
        <svg className="h-8 w-8 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.068 2.068M18 14.25v4.5M6.75 8.25h.008v.008H6.75V8.25Z" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-full w-full object-cover" />
  );
}

function PlaceholderPhoto() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
      <svg className="h-8 w-8 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25a1.125 1.125 0 0 1-1.125-1.125V6.75m18.375 7.5V6.75m0 0a1.125 1.125 0 0 0-1.125-1.125H3.375a1.125 1.125 0 0 0-1.125 1.125m18.375 0V3.375" />
      </svg>
    </div>
  );
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/vehicles/detail?id=${vehicle.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500/50"
    >
      <div className="relative aspect-[16/9] w-full">
        {vehicle.photoPath ? (
          <VehiclePhoto photoPath={vehicle.photoPath} />
        ) : (
          <PlaceholderPhoto />
        )}
      </div>
      <div className="p-4">
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
            {VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {formatMileage(vehicle.currentMileage, vehicle.type) && (
            <span>{formatMileage(vehicle.currentMileage, vehicle.type)} mi</span>
          )}
          {vehicle.engine && <span>{vehicle.engine}</span>}
        </div>
        {!vehicle.isActive && (
          <span className="mt-2 inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Inactive
          </span>
        )}
      </div>
    </Link>
  );
}
