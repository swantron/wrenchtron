"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useVehicles } from "@/hooks/useVehicles";
import { useActionableItems } from "@/hooks/useActionableItems";
import { subscribeToMaintenanceLogs, deleteVehicle } from "@/lib/firebase/firestore";
import { getReceiptURL } from "@/lib/firebase/storage";
import { computeSummary, MaintenanceSummary } from "@/components/dashboard/MaintenanceSummary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { ActionItem } from "@/utils/maintenance";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";

function ServiceProgressBar({ item }: { item: ActionItem }) {
  let progress: number | null = null;

  if (item.intervalMiles !== undefined && item.remainingMiles !== undefined) {
    progress = Math.min(100, Math.max(0, ((item.intervalMiles - item.remainingMiles) / item.intervalMiles) * 100));
  } else if (item.intervalDays !== undefined && item.remainingDays !== undefined) {
    progress = Math.min(100, Math.max(0, ((item.intervalDays - item.remainingDays) / item.intervalDays) * 100));
  }

  if (progress === null) return null;

  const isCritical = item.status === "overdue";
  const isWarning = item.status === "due_soon";

  return (
    <div className="mt-4">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        <span>{item.serviceName}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/50">
        <div
          className={`h-full transition-all duration-1000 ease-out ${
            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function GarageVehicleCard({ vehicle, items }: { vehicle: Vehicle; items: ActionItem[] }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !vehicle.id) return;
    const unsub = subscribeToMaintenanceLogs(user.uid, vehicle.id, setLogs);
    return unsub;
  }, [user, vehicle.id]);

  useEffect(() => {
    let active = true;
    const loadPhoto = async () => {
      if (vehicle.photoPath) {
        try {
          const url = await getReceiptURL(vehicle.photoPath);
          if (active) setPhotoUrl(url);
        } catch {
          // ignore
        }
      } else {
        if (active) setPhotoUrl(null);
      }
    };
    loadPhoto();
    return () => { active = false; };
  }, [vehicle.photoPath]);

  const summary = computeSummary(logs, vehicle.currentMileage);
  const urgentItem = items[0];

  const handleDelete = async () => {
    if (!user || !vehicle.id) return;
    if (!confirm(`Delete ${vehicle.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteVehicle(user.uid, vehicle.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500/50">
      <Link href={`/vehicles/detail?id=${vehicle.id}`} className="block">
        <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900">
          {photoUrl ? (
            <NextImage src={photoUrl} alt={vehicle.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25a1.125 1.125 0 0 1-1.125-1.125V6.75m18.375 7.5V6.75m0 0a1.125 1.125 0 0 0-1.125-1.125H3.375a1.125 1.125 0 0 0-1.125 1.125m18.375 0V3.375" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {vehicle.name}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <div className="mt-4">
            <MaintenanceSummary summary={summary} />
            {urgentItem && <ServiceProgressBar item={urgentItem} />}
          </div>
        </div>
      </Link>

      {/* Management actions — outside the Link to avoid nesting, fade in on hover */}
      <div className="flex justify-end gap-1 border-t border-gray-100 px-5 py-3 opacity-0 transition-opacity group-hover:opacity-100 dark:border-gray-700/50">
        <Link
          href={`/vehicles/edit?id=${vehicle.id}`}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {/* Quick log button */}
      <Link
        href={`/maintenance/new?vehicleId=${vehicle.id}`}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 active:scale-95"
        title="Quick Log"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}

export function VehicleList() {
  const { vehicles, loading } = useVehicles();
  const { items: actionItems } = useActionableItems(vehicles);

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
          href="/vehicles/new"
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add to Garage
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <GarageVehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          items={actionItems.filter((i) => i.vehicleId === vehicle.id)}
        />
      ))}
    </div>
  );
}
