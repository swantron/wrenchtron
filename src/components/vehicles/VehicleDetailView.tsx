"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getVehicle, deleteVehicle } from "@/lib/firebase/firestore";
import type { Vehicle } from "@/types/firestore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LogList } from "@/components/maintenance/LogList";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

export function VehicleDetailView({ vehicleId }: { vehicleId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !vehicleId) return;
    getVehicle(user.uid, vehicleId).then((v) => {
      setVehicle(v);
      setLoading(false);
    });
  }, [user, vehicleId]);

  const handleDelete = async () => {
    if (!user || !vehicleId) return;
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    setDeleting(true);
    try {
      await deleteVehicle(user.uid, vehicleId);
      router.push("/vehicles");
    } catch {
      setDeleting(false);
    }
  };

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
        <Link
          href="/vehicles"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to vehicles
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {vehicle.name}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/vehicles/edit?id=${vehicleId}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem
          label="Mileage"
          value={`${vehicle.currentMileage.toLocaleString()} mi`}
        />
        {vehicle.engine && <DetailItem label="Engine" value={vehicle.engine} />}
        {vehicle.transmission && (
          <DetailItem label="Transmission" value={vehicle.transmission} />
        )}
        {vehicle.drivetrain && (
          <DetailItem label="Drivetrain" value={vehicle.drivetrain} />
        )}
        {vehicle.vin && <DetailItem label="VIN" value={vehicle.vin} />}
        {vehicle.licensePlate && (
          <DetailItem label="License Plate" value={vehicle.licensePlate} />
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Maintenance History
          </h2>
          <Link
            href={`/maintenance/new?vehicleId=${vehicleId}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Log Maintenance
          </Link>
        </div>
        <div className="mt-4">
          <LogList vehicleId={vehicleId} />
        </div>
      </div>
    </div>
  );
}
