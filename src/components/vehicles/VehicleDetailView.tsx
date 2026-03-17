"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getVehicle, deleteVehicleWithLogs, subscribeToMaintenanceLogs, archiveVehicle, unarchiveVehicle } from "@/lib/firebase/firestore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getReceiptURL } from "@/lib/firebase/storage";
import { formatMileage, formatRelativeTime, isRoadVehicle } from "@/utils/vehicleUtils";
import { useToast } from "@/components/ui/Toast";
import { downloadCSV, printMaintenanceHistory } from "@/utils/export";
import NextImage from "next/image";
import { LogList } from "@/components/maintenance/LogList";

import { ServiceStatusPanel } from "@/components/vehicles/ServiceStatusPanel";
import { RecallPanel } from "@/components/vehicles/RecallPanel";
import { ServiceIntervalManager } from "@/components/vehicles/ServiceIntervalManager";

function ExportMenu({ vehicle, logs }: { vehicle: Vehicle; logs: MaintenanceLog[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => { downloadCSV(vehicle, logs); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => { printMaintenanceHistory(vehicle, logs); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        </div>
      )}
    </div>
  );
}

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
  const { showToast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(initialVehicle || null);
  const [logs, setLogs] = useState<MaintenanceLog[]>(initialLogs || []);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    (initialVehicle?.photoPath && initialVehicle.photoPath.startsWith("/"))
      ? initialVehicle.photoPath
      : null
  );
  const [loading, setLoading] = useState(!initialVehicle);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [unarchiving, setUnarchiving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [unarchiveConfirmOpen, setUnarchiveConfirmOpen] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!user || !vehicleId) return;
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await deleteVehicleWithLogs(user.uid, vehicleId, logs.map((l) => l.id!));
      router.push("/vehicles");
    } catch {
      showToast("Failed to delete vehicle. Please try again.", "error");
      setDeleting(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!user || !vehicleId) return;
    setArchiveConfirmOpen(false);
    setArchiving(true);
    try {
      await archiveVehicle(user.uid, vehicleId);
      router.push("/vehicles");
    } catch {
      showToast("Failed to archive vehicle. Please try again.", "error");
      setArchiving(false);
    }
  };

  const handleUnarchiveConfirm = async () => {
    if (!user || !vehicleId) return;
    setUnarchiveConfirmOpen(false);
    setUnarchiving(true);
    try {
      await unarchiveVehicle(user.uid, vehicleId);
      showToast("Vehicle restored to garage.", "success");
      setVehicle((v) => v ? { ...v, isArchived: false, archivedAt: undefined } : v);
      setUnarchiving(false);
    } catch {
      showToast("Failed to restore vehicle. Please try again.", "error");
      setUnarchiving(false);
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
    <>
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
        <div className="flex flex-wrap gap-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back to Fleet
            </button>
          ) : vehicle.isArchived ? (
            <Link
              href="/vehicles/archived"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back to Archived
            </Link>
          ) : null}
          {!onBack && (
            <>
              {!vehicle.isArchived && (
              <Link
                href={`/vehicles/edit?id=${vehicleId}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Edit
              </Link>
              )}
              {vehicle.isArchived ? (
                <button
                  onClick={() => setUnarchiveConfirmOpen(true)}
                  disabled={unarchiving}
                  className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                >
                  {unarchiving ? "Restoring…" : "Restore to Garage"}
                </button>
              ) : (
                <button
                  onClick={() => setArchiveConfirmOpen(true)}
                  disabled={archiving}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
                >
                  {archiving ? "Archiving…" : "Archive"}
                </button>
              )}
              <button
                onClick={() => setConfirmOpen(true)}
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
          <ServiceStatusPanel vehicle={vehicle} logs={logs} />

          {isRoadVehicle(vehicle.type) && <RecallPanel vehicle={vehicle} />}

          {(formatMileage(vehicle.currentMileage, vehicle.type) || isRoadVehicle(vehicle.type)) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Vehicle Specs
              </h3>
              <dl className="space-y-4">
                {formatMileage(vehicle.currentMileage, vehicle.type) && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">
                      Current Mileage
                    </dt>
                    <dd className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatMileage(vehicle.currentMileage, vehicle.type)} mi
                      </span>
                      {vehicle.updatedAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Updated {formatRelativeTime(vehicle.updatedAt.toDate())}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {isRoadVehicle(vehicle.type) && vehicle.engine && <DetailItem label="Engine" value={vehicle.engine} />}
                {isRoadVehicle(vehicle.type) && vehicle.transmission && <DetailItem label="Transmission" value={vehicle.transmission} />}
                {isRoadVehicle(vehicle.type) && vehicle.drivetrain && <DetailItem label="Drivetrain" value={vehicle.drivetrain} />}
                {isRoadVehicle(vehicle.type) && vehicle.vin && <DetailItem label="VIN" value={vehicle.vin} />}
                {isRoadVehicle(vehicle.type) && vehicle.licensePlate && <DetailItem label="License Plate" value={vehicle.licensePlate} />}
              </dl>
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Maintenance History
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              {logs.length > 0 && <ExportMenu vehicle={vehicle} logs={logs} />}
              {!vehicle.isArchived && (
                <Link
                  href={onBack ? "/login" : `/maintenance/new?vehicleId=${vehicleId}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Log Service
                </Link>
              )}
            </div>
          </div>
          <div className="mt-6">
            <LogList vehicleId={vehicleId} logs={initialLogs} />
          </div>
        </div>
      </div>

      {!onBack && !vehicle.isArchived && (
        <div className="mt-12 border-t border-gray-100 pt-12 dark:border-gray-800">
          <ServiceIntervalManager
            vehicle={vehicle}
            onIntervalsChange={(intervals) =>
              setVehicle((v) => v ? { ...v, serviceIntervals: intervals } : v)
            }
          />
        </div>
      )}
    </div>

    <ConfirmDialog
      open={confirmOpen}
      title="Delete Vehicle"
      description={`This will permanently delete this vehicle and all ${logs.length} maintenance log(s). This cannot be undone.`}
      confirmLabel="Delete"
      destructive
      onConfirm={handleDeleteConfirm}
      onCancel={() => setConfirmOpen(false)}
    />
    <ConfirmDialog
      open={archiveConfirmOpen}
      title="Archive Vehicle?"
      description="This will move the vehicle to your archive. You can view and restore it later. Maintenance history is preserved."
      confirmLabel="Archive"
      onConfirm={handleArchiveConfirm}
      onCancel={() => setArchiveConfirmOpen(false)}
    />
    <ConfirmDialog
      open={unarchiveConfirmOpen}
      title="Restore to Garage?"
      description="This will move the vehicle back to your garage."
      confirmLabel="Restore"
      onConfirm={handleUnarchiveConfirm}
      onCancel={() => setUnarchiveConfirmOpen(false)}
    />
    </>
  );
}
