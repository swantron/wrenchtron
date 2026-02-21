"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { deleteVehicle } from "@/lib/firebase/firestore";
import { getReceiptURL } from "@/lib/firebase/storage";
import type { Vehicle } from "@/types/firestore";
import type { ActionItem } from "@/utils/maintenance";
import { VEHICLE_TYPE_LABELS, formatMileage } from "@/utils/vehicleUtils";

interface VehicleCardProps {
  vehicle: Vehicle;
  items: ActionItem[];
  layout: "dashboard" | "garage";
  onClick?: () => void;
  href?: string;
  isDemo?: boolean;
}

function ServiceStatusStrip({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">No services tracked</p>;
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
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{item.reason}</span>
          </div>
        );
      })}
      {items.length > 3 && (
        <p className="text-xs text-gray-400">+{items.length - 3} more</p>
      )}
    </div>
  );
}

export function VehicleCard({ vehicle, items, layout, onClick, href, isDemo }: VehicleCardProps) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !vehicle.id) return;
    if (!confirm(`Delete ${vehicle.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteVehicle(user.uid, vehicle.id);
    } catch {
      setDeleting(false);
    }
  };

  const CardWrapper = onClick ? "button" : Link;
  const wrapperProps = onClick
    ? { onClick, className: "block w-full text-left" }
    : { href: href || `/vehicles/detail?id=${vehicle.id}`, className: "block" };

  return (
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {vehicle.name}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
            {layout === "garage" && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type}
              </span>
            )}
          </div>

          <div className="mt-4">
            <ServiceStatusStrip items={items} />
          </div>

          {layout === "garage" && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {formatMileage(vehicle.currentMileage, vehicle.type) && (
                <span>{formatMileage(vehicle.currentMileage, vehicle.type)} mi</span>
              )}
              {vehicle.engine && <span>{vehicle.engine}</span>}
            </div>
          )}
        </div>
      </CardWrapper>

      {/* Management actions — visible only on Garage page, fade in on hover */}
      {layout === "garage" && (
        <div className="flex justify-end gap-1 border-t border-gray-100 px-5 py-3 opacity-0 transition-opacity group-hover:opacity-100 dark:border-gray-700/50">
          <Link
            href={isDemo ? "/login" : `/vehicles/edit?id=${vehicle.id}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {isDemo ? "Sign Up" : "Edit"}
          </Link>
          {!isDemo && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      )}

      {/* Quick log button */}
      <Link
        href={isDemo ? "/login" : `/maintenance/new?vehicleId=${vehicle.id}`}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 active:scale-95"
        title={isDemo ? "Sign up to log service" : "Quick Log"}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
