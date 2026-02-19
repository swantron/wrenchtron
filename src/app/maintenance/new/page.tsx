"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
import { useAuth } from "@/hooks/useAuth";
import { getVehicle } from "@/lib/firebase/firestore";
import type { VehicleType } from "@/types/firestore";
import type { MaintenanceType } from "@/types/maintenance";

function NewMaintenanceContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const vehicleId = searchParams.get("vehicleId");
  const typeParam = searchParams.get("type") as MaintenanceType | null;
  const [vehicleType, setVehicleType] = useState<VehicleType | undefined>();

  useEffect(() => {
    if (!user || !vehicleId) return;
    getVehicle(user.uid, vehicleId).then((v) => {
      if (v) setVehicleType(v.type);
    });
  }, [user, vehicleId]);

  if (!vehicleId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No vehicle selected.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Log Maintenance
      </h1>
      <div className="mt-6">
        <MaintenanceForm
          vehicleId={vehicleId}
          vehicleType={vehicleType}
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
        <Suspense>
          <NewMaintenanceContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
