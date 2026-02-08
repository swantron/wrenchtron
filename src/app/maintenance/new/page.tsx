"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";

function NewMaintenanceContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId");

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
        <MaintenanceForm vehicleId={vehicleId} />
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
