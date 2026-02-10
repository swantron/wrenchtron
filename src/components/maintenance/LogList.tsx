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

function LogDetails({ log }: { log: MaintenanceLog }) {
  const details = log.details as any;
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

      <LogDetails log={log} />

      {(log.shop || log.notes) && (
        <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
          {log.shop && <p>Shop: {log.shop}</p>}
          {log.notes && <p className="italic">"{log.notes}"</p>}
        </div>
      )}
      {log.receiptPaths.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {log.receiptPaths.length} receipt(s)
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
