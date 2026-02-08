"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { EditVehicleView } from "@/components/vehicles/EditVehicleView";

function EditVehicleContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("id");

  if (!vehicleId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No vehicle selected.</p>
      </div>
    );
  }

  return <EditVehicleView vehicleId={vehicleId} />;
}

export default function EditVehiclePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense>
          <EditVehicleContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
