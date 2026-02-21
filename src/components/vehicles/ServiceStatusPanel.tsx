import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";
import { calculateActionItems } from "@/utils/maintenance";

interface ServiceStatusPanelProps {
  vehicle: Vehicle;
  logs: MaintenanceLog[];
}

export function ServiceStatusPanel({ vehicle, logs }: ServiceStatusPanelProps) {
  const items = calculateActionItems(vehicle, logs);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Service Status
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">No service intervals configured.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Service Status
      </h3>
      <div className="space-y-4">
        {items.map(item => {
          const dot = item.status === "overdue"
            ? "bg-red-500"
            : item.status === "due_soon"
            ? "bg-amber-500"
            : "bg-green-500";

          const nextDate = item.projectedDate ?? item.dueDate;
          const nextLabel = nextDate
            ? nextDate.toLocaleDateString("default", { month: "short", year: "numeric" })
            : "—";

          const lastLine = item.lastLog
            ? `Last: ${item.lastLog.date.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })} @ ${item.lastLog.mileage.toLocaleString()} mi${item.lastLog.shop ? ` · ${item.lastLog.shop}` : ""}`
            : "No history";

          return (
            <div key={item.id} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                  <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {item.serviceName}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  Next ~{nextLabel}
                </span>
              </div>
              <p className="pl-4 text-xs text-gray-400 dark:text-gray-500">{lastLine}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
