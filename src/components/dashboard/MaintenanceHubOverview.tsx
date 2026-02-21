import Link from "next/link";
import type { ActionItem } from "@/utils/maintenance";

interface MaintenanceHubOverviewProps {
  actionItems: ActionItem[];
}

function formatSupplyLine(item: ActionItem): string | null {
  const d = item.lastLog?.details as Record<string, unknown> | undefined;
  if (!d) return null;

  const parts: string[] = [];
  if (d.oilBrand && d.oilWeight) parts.push(`${d.oilBrand} ${d.oilWeight}`);
  if (d.oilQuantity) parts.push(`${d.oilQuantity}qt`);
  if (d.filterBrand) parts.push(`${d.filterBrand}${d.filterPartNumber ? ` ${d.filterPartNumber}` : ""} filter`);
  if (d.brand && d.model) parts.push(`${d.brand} ${d.model}`);
  if (d.size) parts.push(String(d.size));
  if (d.brand && d.partNumber) parts.push(`${d.brand} ${d.partNumber}`);
  else if (d.brand && !d.model) parts.push(String(d.brand));

  return parts.length ? parts.join(" · ") : null;
}

export function MaintenanceHubOverview({ actionItems }: MaintenanceHubOverviewProps) {
  const thisWeek = actionItems.filter(
    i => i.status === "overdue" || (i.remainingDays !== undefined && i.remainingDays <= 7)
  );
  const thisMonth = actionItems.filter(
    i => i.status !== "overdue" && i.remainingDays !== undefined && i.remainingDays > 7 && i.remainingDays <= 30
  );
  const later = actionItems.filter(
    i => i.status !== "overdue" && (i.remainingDays === undefined || i.remainingDays > 30)
  );

  // Limit total shown to 10
  const allShown = [...thisWeek, ...thisMonth, ...later].slice(0, 10);
  const thisWeekShown = allShown.filter(i => thisWeek.includes(i));
  const thisMonthShown = allShown.filter(i => thisMonth.includes(i));
  const laterShown = allShown.filter(i => later.includes(i));

  const hasUrgent = thisWeek.length > 0 || thisMonth.length > 0;

  // Supply list: overdue + due_soon with supply data
  const supplyItems = actionItems.filter(
    i => (i.status === "overdue" || i.status === "due_soon") && formatSupplyLine(i) !== null
  );

  // Group supply items by vehicle
  const supplyByVehicle = new Map<string, { vehicleName: string; items: ActionItem[] }>();
  for (const item of supplyItems) {
    if (!supplyByVehicle.has(item.vehicleId)) {
      supplyByVehicle.set(item.vehicleId, { vehicleName: item.vehicleName, items: [] });
    }
    supplyByVehicle.get(item.vehicleId)!.items.push(item);
  }

  return (
    <div className="space-y-8">
      {/* Section A: Upcoming Schedule */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Upcoming Schedule
        </h2>

        {!hasUrgent && actionItems.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800/50 dark:bg-green-900/20">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">All Clear — no services due soon</p>
          </div>
        ) : !hasUrgent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800/50 dark:bg-green-900/20">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">All Clear — no services overdue or due soon</p>
          </div>
        ) : null}

        {thisWeekShown.length > 0 && (
          <ScheduleSection label="This Week" items={thisWeekShown} />
        )}
        {thisMonthShown.length > 0 && (
          <div className="mt-6">
            <ScheduleSection label="This Month" items={thisMonthShown} />
          </div>
        )}
        {laterShown.length > 0 && (
          <div className="mt-6">
            <ScheduleSection label="Later" items={laterShown} />
          </div>
        )}
      </div>

      {/* Section B: Supply List */}
      {supplyByVehicle.size > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
            What You&apos;ll Need
          </h2>
          <div className="space-y-4">
            {Array.from(supplyByVehicle.values()).map(({ vehicleName, items }) => (
              <div key={vehicleName} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">{vehicleName}</p>
                <div className="space-y-2">
                  {items.map(item => {
                    const supply = formatSupplyLine(item);
                    return (
                      <div key={item.id} className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.serviceName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{supply}</span>
                        {item.lastLog?.shop && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Last done at {item.lastLog.shop}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleSection({ label, items }: { label: string; items: ActionItem[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-gray-700/50 dark:border-gray-700 dark:bg-gray-800">
        {items.map(item => {
          const dot = item.status === "overdue"
            ? "bg-red-500"
            : item.status === "due_soon"
            ? "bg-amber-500"
            : "bg-green-500";
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {item.vehicleName}
                </span>
                <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                  {item.serviceName}
                </span>
                <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">{item.reason}</span>
              </div>
              <Link
                href={`/maintenance/new?vehicleId=${item.vehicleId}`}
                className="shrink-0 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
              >
                Log Service
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
