"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useVehicles } from "@/hooks/useVehicles";
import { getVehicle } from "@/lib/firebase/firestore";
import type { VehicleType } from "@/types/firestore";
import type { MaintenanceType } from "@/types/maintenance";

function NewMaintenanceContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const vehicleId = searchParams.get("vehicleId");
  const typeParam = searchParams.get("type") as MaintenanceType | null;
  const [vehicle, setVehicle] = useState<{ name: string; type: VehicleType } | null>(null);

  useEffect(() => {
    if (!user || !vehicleId) return;
    getVehicle(user.uid, vehicleId).then((v) => {
      if (v) setVehicle({ name: v.name, type: v.type });
    });
  }, [user, vehicleId]);

  if (!vehicleId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Log Maintenance
        </h1>
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">Select a vehicle to log maintenance.</p>
          {vehiclesLoading ? (
            <p className="mt-4 text-sm text-gray-500">Loading vehicles…</p>
          ) : vehicles.length === 0 ? (
            <div className="mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">No vehicles in your garage yet.</p>
              <Link
                href="/vehicles/new"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-700"
              >
                Add Vehicle
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose a vehicle:</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                {vehicles.map((v) => (
                  <Link
                    key={v.id}
                    href={`/maintenance/new?vehicleId=${v.id}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                  >
                    {v.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/vehicles"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all in Garage →
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Log Maintenance{vehicle ? ` — ${vehicle.name}` : ""}
      </h1>
      <div className="mt-6">
        <MaintenanceForm
          vehicleId={vehicleId}
          vehicleType={vehicle?.type}
          initialType={typeParam ?? undefined}
        />
      </div>
    </div>
  );
}

export default function NewMaintenancePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner /></div>}>
          <NewMaintenanceContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
