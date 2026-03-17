"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { deleteVehicleWithLogs, archiveVehicle, unarchiveVehicle } from "@/lib/firebase/firestore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getReceiptURL } from "@/lib/firebase/storage";
import type { Vehicle } from "@/types/firestore";
import type { ActionItem } from "@/utils/maintenance";
import { getVehicleTypeLabel, formatMileage } from "@/utils/vehicleUtils";

interface VehicleCardProps {
  vehicle: Vehicle;
  items: ActionItem[];
  layout: "dashboard" | "garage";
  onClick?: () => void;
  href?: string;
  isDemo?: boolean;
  showUnarchive?: boolean;
}

function UnarchiveButton({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  const { user } = useAuth();
  const [unarchiving, setUnarchiving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleUnarchive = async () => {
    if (!user) return;
    setConfirmOpen(false);
    setUnarchiving(true);
    try {
      await unarchiveVehicle(user.uid, vehicleId);
    } catch {
      setUnarchiving(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        disabled={unarchiving}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-green-50 hover:text-green-600 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-green-900/20 dark:hover:text-green-400"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {unarchiving ? "Restoring…" : "Unarchive"}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={`Restore ${vehicleName}?`}
        description="This will move the vehicle back to your garage."
        confirmLabel="Restore"
        onConfirm={handleUnarchive}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function ServiceStatusStrip({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-gray-600 dark:text-gray-400">No services tracked</p>;
  }
  const shown = items.slice(0, 3);
  return (
    <div className="space-y-2">
      {shown.map(item => {
        const dot = item.status === "overdue" ? "bg-red-500"
          : item.status === "due_soon" ? "bg-amber-500"
          : "bg-green-500";
        return (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{item.serviceName}</span>
            </div>
            <span className="shrink-0 text-xs text-gray-600 dark:text-gray-300">{item.reason}</span>
          </div>
        );
      })}
      {items.length > 3 && (
        <p className="text-xs text-gray-600 dark:text-gray-400">+{items.length - 3} more</p>
      )}
    </div>
  );
}

export function VehicleCard({ vehicle, items, layout, onClick, href, isDemo, showUnarchive }: VehicleCardProps) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    vehicle.photoPath?.startsWith("/") ? vehicle.photoPath : null
  );
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  useEffect(() => {
    if (vehicle.photoPath?.startsWith("/")) return; // static asset, already set
    let active = true;
    const loadPhoto = async () => {
      if (vehicle.photoPath) {
        try {
          const url = await getReceiptURL(vehicle.photoPath);
          if (active) setPhotoUrl(url);
        } catch {
          // ignore
        }
      } else {
        if (active) setPhotoUrl(null);
      }
    };
    loadPhoto();
    return () => { active = false; };
  }, [vehicle.photoPath]);

  const borderClass = items[0]?.status === "overdue"
    ? "border-red-400 dark:border-red-600"
    : items[0]?.status === "due_soon"
    ? "border-amber-300 dark:border-amber-600"
    : "border-gray-200 dark:border-gray-700";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !vehicle.id) return;
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await deleteVehicleWithLogs(user.uid, vehicle.id);
    } catch {
      setDeleting(false);
    }
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArchiveConfirmOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!user || !vehicle.id) return;
    setArchiveConfirmOpen(false);
    setArchiving(true);
    try {
      await archiveVehicle(user.uid, vehicle.id);
    } catch {
      setArchiving(false);
    }
  };

  const CardWrapper = onClick ? "button" : Link;
  const wrapperProps = onClick
    ? { onClick, className: "block w-full text-left" }
    : { href: href || `/vehicles/detail?id=${vehicle.id}`, className: "block" };

  return (
    <>
    <div className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:bg-gray-800 dark:hover:border-blue-500/50 ${borderClass}`}>
      {/* @ts-expect-error - CardWrapper can be 'button' or Link */}
      <CardWrapper {...wrapperProps}>
        <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900">
          {photoUrl ? (
            <NextImage src={photoUrl} alt={vehicle.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25a1.125 1.125 0 0 1-1.125-1.125V6.75m18.375 7.5V6.75m0 0a1.125 1.125 0 0 0-1.125-1.125H3.375a1.125 1.125 0 0 0-1.125 1.125m18.375 0V3.375" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {vehicle.name}
              </div>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
            {layout === "garage" && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {getVehicleTypeLabel(vehicle.type)}
              </span>
            )}
          </div>

          <div className="mt-4">
            <ServiceStatusStrip items={items} />
          </div>

          {layout === "garage" && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {formatMileage(vehicle.currentMileage, vehicle.type) && (
                <span>{formatMileage(vehicle.currentMileage, vehicle.type)} mi</span>
              )}
              {vehicle.engine && <span>{vehicle.engine}</span>}
            </div>
          )}
        </div>
      </CardWrapper>

      {/* Management actions — always visible on Garage page for touch discoverability */}
      {layout === "garage" && (
        <div className="flex justify-end gap-1 border-t border-gray-100 px-5 py-3 dark:border-gray-700/50">
          {showUnarchive ? (
            <>
              <Link
                href={`/vehicles/detail?id=${vehicle.id}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              >
                View
              </Link>
              {!isDemo && (
                <UnarchiveButton vehicleId={vehicle.id!} vehicleName={vehicle.name} />
              )}
            </>
          ) : (
            <>
              <Link
                href={isDemo ? "/login" : `/vehicles/edit?id=${vehicle.id}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isDemo ? "Sign In" : "Edit"}
              </Link>
              {!isDemo && (
                <button
                  onClick={handleArchiveClick}
                  disabled={archiving}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {archiving ? "Archiving…" : "Archive"}
                </button>
              )}
              {!isDemo && (
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Quick log button */}
      <Link
        href={isDemo ? "/login" : `/maintenance/new?vehicleId=${vehicle.id}`}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 active:scale-95"
        aria-label={isDemo ? "Sign in to log service" : "Quick log maintenance"}
        title={isDemo ? "Sign in to log service" : "Quick Log"}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>

    </div>
    <ConfirmDialog
      open={confirmOpen}
      title={`Delete ${vehicle.name}?`}
      description="This will permanently delete this vehicle and all its maintenance logs. This cannot be undone."
      confirmLabel="Delete"
      destructive
      onConfirm={handleDeleteConfirm}
      onCancel={() => setConfirmOpen(false)}
    />
    <ConfirmDialog
      open={archiveConfirmOpen}
      title={`Archive ${vehicle.name}?`}
      description="This will move the vehicle to your archive. You can view and restore it later. Maintenance history is preserved."
      confirmLabel="Archive"
      onConfirm={handleArchiveConfirm}
      onCancel={() => setArchiveConfirmOpen(false)}
    />
    </>
  );
}
