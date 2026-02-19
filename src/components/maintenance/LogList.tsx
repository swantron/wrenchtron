"use client";

import { useState } from "react";
import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import { useAuth } from "@/hooks/useAuth";
import { deleteMaintenanceLog } from "@/lib/firebase/firestore";
import { getReceiptURL } from "@/lib/firebase/storage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type {
  MaintenanceLog,
  MaintenanceType,
  OilChangeDetails,
  TireDetails,
  BrakeDetails,
} from "@/types/maintenance";

const typeLabels: Record<MaintenanceType, string> = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  tire_replacement: "Tire Replacement",
  brake_pads: "Brake Pads",
  brake_rotors: "Brake Rotors",
  air_filter: "Air Filter",
  cabin_filter: "Cabin Filter",
  spark_plugs: "Spark Plugs",
  transmission_fluid: "Transmission Fluid",
  coolant_flush: "Coolant Flush",
  battery: "Battery",
  wiper_blades: "Wiper Blades",
  alignment: "Alignment",
  inspection: "Inspection",
  other: "Other",
};

function formatDate(timestamp: { toDate?: () => Date } | undefined): string {
  if (!timestamp || !timestamp.toDate) return "—";
  return timestamp.toDate().toLocaleDateString();
}

function formatCost(cents: number): string {
  if (!cents) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function LogDetails({ log }: { log: MaintenanceLog }) {
  const details = log.details as OilChangeDetails & TireDetails & BrakeDetails;
  if (!details || Object.keys(details).length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs dark:border-gray-700/50">
      {log.maintenanceType === "oil_change" && (
        <>
          {details.oilBrand && (
            <p className="text-gray-500 dark:text-gray-400">
              Oil: <span className="text-gray-700 dark:text-gray-300">{details.oilBrand} {details.oilWeight}</span>
            </p>
          )}
          {details.filterBrand && (
            <p className="text-gray-500 dark:text-gray-400">
              Filter: <span className="text-gray-700 dark:text-gray-300">{details.filterBrand}</span>
            </p>
          )}
        </>
      )}

      {(log.maintenanceType === "tire_rotation" || log.maintenanceType === "tire_replacement") && (
        <>
          {details.positions && details.positions.length > 0 && (
            <p className="col-span-2 text-gray-500 dark:text-gray-400">
              Pos: <span className="text-gray-700 dark:text-gray-300">{details.positions.join(", ")}</span>
            </p>
          )}
          {details.treadDepth && (
            <p className="text-gray-500 dark:text-gray-400">
              Tread: <span className="text-gray-700 dark:text-gray-300">{details.treadDepth}</span>
            </p>
          )}
          {details.pressure && (
            <p className="text-gray-500 dark:text-gray-400">
              PSI: <span className="text-gray-700 dark:text-gray-300">{details.pressure}</span>
            </p>
          )}
        </>
      )}

      {(log.maintenanceType === "brake_pads" || log.maintenanceType === "brake_rotors") && (
        <>
          {details.position && (
            <p className="text-gray-500 dark:text-gray-400">
              Pos: <span className="text-gray-700 dark:text-gray-300 capitalize">{details.position}</span>
            </p>
          )}
          {details.padThickness && (
            <p className="text-gray-500 dark:text-gray-400">
              Pads: <span className="text-gray-700 dark:text-gray-300">{details.padThickness}</span>
            </p>
          )}
          {details.rotorReplaced && (
            <p className="text-gray-500 dark:text-gray-400">
              Rotors: <span className="text-gray-700 dark:text-gray-300">Replaced</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ReceiptGallery({ paths }: { paths: string[] }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!open && urls.length === 0) {
      setLoading(true);
      const resolved = await Promise.all(
        paths.map((p) => getReceiptURL(p).catch(() => null))
      );
      setUrls(resolved.filter(Boolean) as string[]);
      setLoading(false);
    }
    setOpen((o) => !o);
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {paths.length} Attachment{paths.length !== 1 ? "s" : ""}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3">
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : urls.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Receipt ${i + 1}`}
                    className="aspect-square w-full object-cover transition-opacity hover:opacity-80"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Could not load attachments.</p>
          )}
        </div>
      )}
    </div>
  );
}

function LogItem({
  log,
  onDelete,
}: {
  log: MaintenanceLog;
  onDelete: (logId: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this maintenance log? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await onDelete(log.id!);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/30">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              {typeLabels[log.maintenanceType] || log.maintenanceType}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{formatDate(log.date)}</span>
              {log.mileage > 0 && (
                <>
                  <span>&middot;</span>
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">{log.mileage.toLocaleString()} mi</span>
                </>
              )}
              {log.shop && (
                <>
                  <span>&middot;</span>
                  <span>{log.shop}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
            {formatCost(log.cost)}
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="Delete log"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <LogDetails log={log} />

      {log.notes && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50">
          <p className="text-sm font-medium italic text-gray-600 dark:text-gray-400">
            &ldquo;{log.notes}&rdquo;
          </p>
        </div>
      )}

      {log.receiptPaths.length > 0 && (
        <ReceiptGallery paths={log.receiptPaths} />
      )}
    </div>
  );
}

export function LogList({ vehicleId }: { vehicleId: string }) {
  const { user } = useAuth();
  const { logs, loading } = useMaintenanceLogs(vehicleId);

  const handleDelete = async (logId: string) => {
    if (!user) return;
    await deleteMaintenanceLog(user.uid, vehicleId, logId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
        No maintenance logs yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <LogItem
          key={log.id}
          log={log}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
