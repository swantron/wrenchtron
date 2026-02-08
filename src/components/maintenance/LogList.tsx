"use client";

import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { MaintenanceLog, MaintenanceType } from "@/types/maintenance";

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

function LogItem({ log }: { log: MaintenanceLog }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {typeLabels[log.maintenanceType] || log.maintenanceType}
          </span>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {formatDate(log.date)} &middot; {log.mileage.toLocaleString()} mi
          </p>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCost(log.cost)}
        </span>
      </div>
      {(log.shop || log.notes) && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {log.shop && <p>Shop: {log.shop}</p>}
          {log.notes && <p className="mt-1">{log.notes}</p>}
        </div>
      )}
      {log.receiptPaths.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          {log.receiptPaths.length} receipt(s) attached
        </p>
      )}
    </div>
  );
}

export function LogList({ vehicleId }: { vehicleId: string }) {
  const { logs, loading } = useMaintenanceLogs(vehicleId);

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
        <LogItem key={log.id} log={log} />
      ))}
    </div>
  );
}
