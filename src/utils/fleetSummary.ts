import type { FleetLog, LastVisit, ServiceSummary } from "@/types/fleet";

// Rebuilds the per-van fields the board reads (serviceSummary, lastVisit) from
// a van's logs. logVisit keeps them up to date incrementally; deleting a visit
// recomputes them from whatever logs are left.

const millis = (log: FleetLog) => log.date?.toMillis?.() ?? 0;

export function summarizeLogs(logs: FleetLog[]): { serviceSummary: ServiceSummary; lastVisit: LastVisit | null } {
  const newestFirst = logs.slice().sort((a, b) => millis(b) - millis(a));

  const serviceSummary: ServiceSummary = {};
  for (const log of newestFirst) {
    if (!serviceSummary[log.maintenanceType]) {
      serviceSummary[log.maintenanceType] = { date: log.date, mileage: log.mileage, logId: log.id! };
    }
  }

  const newest = newestFirst[0];
  if (!newest) return { serviceSummary, lastVisit: null };
  const visitLogs = newestFirst.filter((l) => l.visitId === newest.visitId);
  const lastVisit: LastVisit = {
    visitId: newest.visitId,
    date: newest.date,
    mileage: newest.mileage,
    types: visitLogs.map((l) => l.maintenanceType),
    shop: newest.shop ?? "",
    loggedBy: newest.loggedBy,
    siteId: newest.siteId,
    photos: visitLogs.flatMap((l) => l.photos ?? []),
  };
  const title = visitLogs.find((l) => l.title)?.title;
  const notes = visitLogs.find((l) => l.notes)?.notes;
  if (title) lastVisit.title = title;
  if (notes) lastVisit.notes = notes;
  return { serviceSummary, lastVisit };
}
