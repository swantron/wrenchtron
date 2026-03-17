import type { Vehicle } from "@/types/firestore";
import type {
  MaintenanceLog,
  MaintenanceType,
  OilChangeDetails,
  TireDetails,
  BrakeDetails,
  PartDetails,
} from "@/types/maintenance";
import { MAX_DISPLAY_MILEAGE } from "@/utils/vehicleUtils";

const TYPE_LABELS: Record<MaintenanceType, string> = {
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
  blade_sharpening: "Blade Sharpening",
  blade_replacement: "Blade Replacement",
  other: "Other",
};

function formatDate(ts: { toDate?: () => Date } | undefined): string {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDetails(log: MaintenanceLog): string {
  const d = log.details as Record<string, unknown>;
  if (!d || Object.keys(d).length === 0) return "";
  const parts: string[] = [];

  if (log.maintenanceType === "oil_change") {
    const oil = d as OilChangeDetails;
    if (oil.oilBrand && oil.oilWeight) parts.push(`${oil.oilBrand} ${oil.oilWeight}`);
    if (oil.oilQuantity) parts.push(`${oil.oilQuantity}qt`);
    if (oil.filterBrand)
      parts.push(`${oil.filterBrand}${oil.filterPartNumber ? ` ${oil.filterPartNumber}` : ""} filter`);
  } else if (
    log.maintenanceType === "tire_rotation" ||
    log.maintenanceType === "tire_replacement"
  ) {
    const tire = d as TireDetails;
    if (tire.brand && tire.model) parts.push(`${tire.brand} ${tire.model}`);
    if (tire.size) parts.push(tire.size);
    if (tire.positions?.length) parts.push(tire.positions.join("/"));
    if (tire.treadDepth) parts.push(`${tire.treadDepth} tread`);
  } else if (
    log.maintenanceType === "brake_pads" ||
    log.maintenanceType === "brake_rotors"
  ) {
    const brake = d as BrakeDetails;
    if (brake.position) parts.push(brake.position);
    if (brake.brand) parts.push(brake.brand);
    if (brake.padType) parts.push(brake.padType);
    if (brake.rotorReplaced) parts.push("Rotors replaced");
  } else {
    const part = d as PartDetails;
    if (part.brand) parts.push(String(part.brand));
    if (part.partNumber) parts.push(String(part.partNumber));
  }

  return parts.join(" · ");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- CSV ---

export function downloadCSV(vehicle: Vehicle, logs: MaintenanceLog[]): void {
  const headers = ["Date", "Service", "Mileage", "Shop", "Cost", "Notes", "Details"];

  const rows = logs.map((log) => {
    const row = [
      formatDate(log.date),
      TYPE_LABELS[log.maintenanceType] || log.maintenanceType,
      log.mileage > 0 ? log.mileage.toString() : "",
      log.shop || "",
      log.cost ? `$${(log.cost / 100).toFixed(2)}` : "",
      log.notes || "",
      formatDetails(log),
    ];
    return row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${vehicle.name.replace(/[^a-z0-9]/gi, "_")}_maintenance.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Print / PDF ---

export function printMaintenanceHistory(vehicle: Vehicle, logs: MaintenanceLog[]): void {
  const rows = logs
    .map((log) => {
      const details = formatDetails(log);
      const mileage = log.mileage > 0 ? log.mileage.toLocaleString() + " mi" : "—";
      const cost = log.cost ? "$" + (log.cost / 100).toFixed(2) : "—";
      return `
      <tr>
        <td style="white-space:nowrap">${escapeHtml(formatDate(log.date))}</td>
        <td>
          <div class="service">${escapeHtml(TYPE_LABELS[log.maintenanceType] || log.maintenanceType)}</div>
          ${details ? `<div class="detail">${escapeHtml(details)}</div>` : ""}
        </td>
        <td style="white-space:nowrap">${mileage}</td>
        <td>${escapeHtml(log.shop || "—")}</td>
        <td style="white-space:nowrap">${cost}</td>
        <td class="notes">${escapeHtml(log.notes || "")}</td>
      </tr>`;
    })
    .join("");

  const specItems: string[] = [];
  if (vehicle.currentMileage && vehicle.currentMileage < MAX_DISPLAY_MILEAGE)
    specItems.push(`<div class="spec"><label>Odometer</label><span>${vehicle.currentMileage.toLocaleString()} mi</span></div>`);
  if (vehicle.engine)
    specItems.push(`<div class="spec"><label>Engine</label><span>${escapeHtml(vehicle.engine)}</span></div>`);
  if (vehicle.transmission)
    specItems.push(`<div class="spec"><label>Transmission</label><span>${escapeHtml(vehicle.transmission)}</span></div>`);
  if (vehicle.vin)
    specItems.push(`<div class="spec"><label>VIN</label><span>${escapeHtml(vehicle.vin)}</span></div>`);
  if (vehicle.licensePlate)
    specItems.push(`<div class="spec"><label>Plate</label><span>${escapeHtml(vehicle.licensePlate)}</span></div>`);

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${escapeHtml(vehicle.name)} — Maintenance History</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;padding:32px;color:#111;font-size:14px;line-height:1.5}
    h1{font-size:22px;font-weight:800;letter-spacing:-0.01em}
    .meta{color:#6b7280;font-size:13px;margin-top:4px;margin-bottom:24px}
    .specs{display:flex;flex-wrap:wrap;gap:20px;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px}
    .spec label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#9ca3af}
    .spec span{font-size:13px;font-weight:600;color:#111}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;padding:8px 12px;border-bottom:2px solid #e5e7eb}
    td{padding:9px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:13px}
    tr:last-child td{border-bottom:none}
    .service{font-weight:600;color:#111}
    .detail{font-size:12px;color:#6b7280;margin-top:2px}
    .notes{color:#374151;font-style:italic;font-size:12px;max-width:220px}
    @media print{body{padding:0}@page{margin:1.5cm}}
  </style>
</head><body>
  <h1>${escapeHtml(vehicle.name)}</h1>
  <p class="meta">${escapeHtml(`${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`)} &nbsp;·&nbsp; Exported ${exportDate}</p>
  ${specItems.length ? `<div class="specs">${specItems.join("")}</div>` : ""}
  <table>
    <thead><tr>
      <th>Date</th><th>Service</th><th>Odometer</th><th>Shop</th><th>Cost</th><th>Notes</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#9ca3af">No maintenance records</td></tr>'}</tbody>
  </table>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  // Small delay lets the browser finish rendering before the print dialog opens
  setTimeout(() => win.print(), 250);
}
