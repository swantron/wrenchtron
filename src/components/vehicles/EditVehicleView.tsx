"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getVehicle } from "@/lib/firebase/firestore";
import { VehicleForm } from "./VehicleForm";
import type { Vehicle } from "@/types/firestore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function EditVehicleView({ vehicleId }: { vehicleId: string }) {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !vehicleId) return;
    getVehicle(user.uid, vehicleId).then((v) => {
      setVehicle(v);
      setLoading(false);
    });
  }, [user, vehicleId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Vehicle not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Edit Vehicle
      </h1>
      <div className="mt-6">
        <VehicleForm vehicle={vehicle} />
      </div>
    </div>
  );
}
