"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { VehicleForm } from "@/components/vehicles/VehicleForm";

export default function NewVehiclePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Add Vehicle
          </h1>
          <VehicleForm />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
