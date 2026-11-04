import type { FleetLog, FleetSite, FleetVehicle } from "@/types/fleet";
import { TYPE_LABELS } from "@/utils/export";
import { localDate } from "@/utils/format";

// "Your data, any time": every van and every logged job as CSV, with links to
// the photos. Opens in Excel or Google Sheets.

const STATUS_LABELS = { in_service: "In service", at_shop: "At shop", down: "Down" } as const;

/**
 * Quotes a cell. Anything a spreadsheet would run as a formula (=, +, -, @,
 * tab, CR) gets a leading apostrophe, since notes are typed by whoever logs.
 */
export function csvCell(value: string | number | undefined | null): string {
  let text = value === undefined || value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: (string | number | undefined | null)[][]): string {
  // Leading BOM so Excel reads the file as UTF-8
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function isoDate(ts: { toDate?: () => Date } | null | undefined): string {
  const d = ts?.toDate?.();
  return d ? localDate(d) : "";
}

const byUnit = (a: FleetVehicle, b: FleetVehicle) => a.unit.localeCompare(b.unit, undefined, { numeric: true });

export function vansCsv(vehicles: FleetVehicle[], sites: FleetSite[]): string {
  const site = (id: string) => sites.find((s) => s.id === id)?.name ?? "";
  return toCsv(
    ["Unit", "VIN", "Year", "Make", "Model", "Plate", "Site", "Odometer", "Status", "Status note", "Last service", "Added"],
    vehicles
      .slice()
      .sort(byUnit)
      .map((v) => [
        v.unit,
        v.vin,
        v.year || "",
        v.make,
        v.model,
        v.licensePlate,
        site(v.siteId),
        v.currentMileage || "",
        STATUS_LABELS[v.status ?? "in_service"],
        v.statusNote,
        isoDate(v.lastVisit?.date),
        isoDate(v.createdAt),
      ])
  );
}

export function historyCsv(entries: { vehicle: FleetVehicle; log: FleetLog }[], sites: FleetSite[]): string {
  const site = (id: string) => sites.find((s) => s.id === id)?.name ?? "";
  return toCsv(
    ["Date", "Unit", "VIN", "Service", "Odometer", "Shop", "Site", "Logged by", "Cost", "Notes", "Photos"],
    entries
      .slice()
      .sort((a, b) => (b.log.date?.toMillis?.() ?? 0) - (a.log.date?.toMillis?.() ?? 0) || byUnit(a.vehicle, b.vehicle))
      .map(({ vehicle, log }) => [
        isoDate(log.date),
        vehicle.unit,
        vehicle.vin,
        log.title ?? TYPE_LABELS[log.maintenanceType] ?? log.maintenanceType,
        log.mileage || "",
        log.shop,
        site(log.siteId),
        log.loggedBy?.name,
        log.cost ? (log.cost / 100).toFixed(2) : "",
        log.notes,
        (log.photos ?? []).map((p) => p.url).join(" "),
      ])
  );
}

export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
