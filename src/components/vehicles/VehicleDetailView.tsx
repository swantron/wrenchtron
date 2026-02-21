"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getVehicle, deleteVehicle, subscribeToMaintenanceLogs } from "@/lib/firebase/firestore";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getReceiptURL } from "@/lib/firebase/storage";
import { formatMileage } from "@/utils/vehicleUtils";
import NextImage from "next/image";
import { LogList } from "@/components/maintenance/LogList";

import { MaintenanceSummary, computeSummary } from "@/components/dashboard/MaintenanceSummary";
import { ServiceIntervalManager } from "@/components/vehicles/ServiceIntervalManager";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

export function VehicleDetailView({
  vehicleId,
  vehicle: initialVehicle,
  logs: initialLogs,
  onBack
}: {
  vehicleId: string;
  vehicle?: Vehicle;
  logs?: MaintenanceLog[];
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(initialVehicle || null);
  const [logs, setLogs] = useState<MaintenanceLog[]>(initialLogs || []);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    (initialVehicle?.photoPath && initialVehicle.photoPath.startsWith("/"))
      ? initialVehicle.photoPath
      : null
  );
  const [loading, setLoading] = useState(!initialVehicle);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialVehicle) return;
    if (!user || !vehicleId) return;

    // Fetch vehicle
    getVehicle(user.uid, vehicleId).then((v) => {
      setVehicle(v);
      setLoading(false);
    });

    // Subscribe to logs for summary
    const unsub = subscribeToMaintenanceLogs(user.uid, vehicleId, setLogs);
    return unsub;
  }, [user, vehicleId, initialVehicle]);

  useEffect(() => {
    // If it's a static path (already initialized in state correctly), skip
    if (vehicle?.photoPath && vehicle.photoPath.startsWith("/")) return;

    let active = true;
    const loadPhoto = async () => {
      if (vehicle?.photoPath) {
        try {
          const url = await getReceiptURL(vehicle.photoPath);
          if (active) setPhotoUrl(url);
        } catch (error) {
          console.error("Failed to load vehicle photo:", error);
        }
      } else {
        if (active) setPhotoUrl(null);
      }
    };
    loadPhoto();
    return () => {
      active = false;
    };
  }, [vehicle?.photoPath, initialVehicle?.photoPath]);

  const summary = vehicle ? computeSummary(logs, vehicle.currentMileage) : null;

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
          {onBack ? (
            <button
              onClick={onBack}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back to Fleet
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {photoUrl && (
        <div className="relative mt-6 aspect-[3/1] w-full overflow-hidden rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
          <NextImage
            src={photoUrl}
            alt={vehicle.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left: Stats & Status */}
        <div className="space-y-6 lg:col-span-1">
          {summary && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Service Status
              </h3>
              <MaintenanceSummary summary={summary} />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vehicle Specs
            </h3>
            <dl className="space-y-4">
              {formatMileage(vehicle.currentMileage, vehicle.type) && (
                <DetailItem
                  label="Current Mileage"
                  value={`${formatMileage(vehicle.currentMileage, vehicle.type)} mi`}
                />
              )}
              {vehicle.engine && <DetailItem label="Engine" value={vehicle.engine} />}
              {vehicle.transmission && <DetailItem label="Transmission" value={vehicle.transmission} />}
              {vehicle.drivetrain && <DetailItem label="Drivetrain" value={vehicle.drivetrain} />}
              {vehicle.vin && <DetailItem label="VIN" value={vehicle.vin} />}
              {vehicle.licensePlate && <DetailItem label="License Plate" value={vehicle.licensePlate} />}
            </dl>
          </div>
        </div>

        {/* Right: History */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Maintenance History
            </h2>
            <Link
              href={onBack ? "/login" : `/maintenance/new?vehicleId=${vehicleId}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Log Service
            </Link>
          </div>
          <div className="mt-6">
            <LogList vehicleId={vehicleId} logs={initialLogs} />
          </div>
        </div>
      </div>

      {!onBack && (
        <div className="mt-12 border-t border-gray-100 pt-12 dark:border-gray-800">
          <ServiceIntervalManager vehicle={vehicle} />
        </div>
      )}
    </div >
  );
}
