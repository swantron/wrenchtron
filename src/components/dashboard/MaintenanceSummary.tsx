"use client";

import type { MaintenanceLog } from "@/types/maintenance";

type Status = "green" | "yellow" | "red";

interface SummaryData {
  daysSinceLastService: number | null;
  milesSinceLastService: number | null;
  lastServiceType: string | null;
  status: Status;
}

function getStatus(daysSince: number | null): Status {
  if (daysSince === null) return "red";
  if (daysSince <= 90) return "green";
  if (daysSince <= 180) return "yellow";
  return "red";
}

const statusColors: Record<Status, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<Status, string> = {
  green: "Up to date",
  yellow: "Due soon",
  red: "Overdue",
};

const typeLabels: Record<string, string> = {
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

export function computeSummary(
  logs: MaintenanceLog[],
  currentMileage: number
): SummaryData {
  if (logs.length === 0) {
    return {
      daysSinceLastService: null,
      milesSinceLastService: null,
      lastServiceType: null,
      status: "red",
    };
  }

  const latest = logs[0]; // already sorted desc by date
  const lastDate = latest.date?.toDate?.();
  const daysSince = lastDate
    ? Math.floor(
        (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const milesSince = currentMileage - latest.mileage;

  return {
    daysSinceLastService: daysSince,
    milesSinceLastService: milesSince >= 0 ? milesSince : null,
    lastServiceType: latest.maintenanceType,
    status: getStatus(daysSince),
  };
}

export function MaintenanceSummary({ summary }: { summary: SummaryData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[summary.status]}`}
        >
          {statusLabels[summary.status]}
        </span>
      </div>
      {summary.lastServiceType ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>
            Last:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {typeLabels[summary.lastServiceType] || summary.lastServiceType}
            </span>
          </p>
          {summary.daysSinceLastService !== null && (
            <p>{summary.daysSinceLastService} days ago</p>
          )}
          {summary.milesSinceLastService !== null && (
            <p>{summary.milesSinceLastService.toLocaleString()} mi since</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No service history
        </p>
      )}
    </div>
  );
}
