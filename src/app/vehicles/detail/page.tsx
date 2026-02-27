"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { VehicleDetailView } from "@/components/vehicles/VehicleDetailView";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function VehicleDetailContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("id");

  if (!vehicleId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No vehicle selected.</p>
      </div>
    );
  }

  return <VehicleDetailView vehicleId={vehicleId} />;
}

export default function VehicleDetailPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner /></div>}>
          <VehicleDetailContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
