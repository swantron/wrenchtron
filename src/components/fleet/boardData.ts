import type { FleetLog as BoardLog, FleetPhoto as BoardPhoto, FleetVan as BoardVan } from "@/data/fleetDemoData";
import type { FleetLog, FleetLogPhoto, FleetPhotoKind, FleetSite, FleetVehicle } from "@/types/fleet";
import type { MaintenanceType } from "@/types/maintenance";

// Firestore fleet data → the shapes the shared board (FleetBoard.tsx) renders.

/** Delivery vans run ~25–35k a year; used until a van has enough history to say otherwise. */
const DEFAULT_ANNUAL_MILES = 30000;

export const PHOTO_KIND_LABELS: Record<FleetPhotoKind, string> = {
  odometer: "Odometer",
  part: "Part",
  invoice: "Invoice",
  tire: "Tire",
  brake: "Brake",
  damage: "Damage",
  other: "Photo",
};

function toBoardPhoto(photo: FleetLogPhoto): BoardPhoto {
  return { id: photo.path, kind: photo.kind, caption: photo.caption || PHOTO_KIND_LABELS[photo.kind], src: photo.url };
}

function siteName(sites: FleetSite[], id: string): string {
  return sites.find((s) => s.id === id)?.name ?? "";
}

/** Server timestamps are null until the write lands; treat those as now. */
function toDate(value: { toDate(): Date } | null | undefined): Date {
  return value?.toDate?.() ?? new Date();
}

function fromLog(log: FleetLog, sites: FleetSite[]): BoardLog {
  return {
    id: log.id!,
    maintenanceType: log.maintenanceType,
    title: log.title,
    date: toDate(log.date),
    mileage: log.mileage,
    cost: log.cost ?? 0,
    shop: log.shop ?? "",
    tech: log.loggedBy?.name ?? "",
    location: siteName(sites, log.siteId),
    notes: log.notes,
    details: {},
    photos: (log.photos ?? []).map(toBoardPhoto),
  };
}

/** The van's last visit as logs (one per service, photos on the first), for the board's Recent work. */
function fromLastVisit(vehicle: FleetVehicle, sites: FleetSite[]): BoardLog[] {
  const visit = vehicle.lastVisit;
  if (!visit) return [];
  return visit.types.map((type, i) => ({
    id: `${visit.visitId}-${i}`,
    maintenanceType: type,
    title: i === 0 ? visit.title : undefined,
    date: toDate(visit.date),
    mileage: visit.mileage,
    cost: 0,
    shop: visit.shop,
    tech: visit.loggedBy.name,
    location: siteName(sites, visit.siteId),
    notes: i === 0 ? visit.notes : undefined,
    details: {},
    photos: i === 0 ? visit.photos.map(toBoardPhoto) : [],
  }));
}

/** Latest log per service type, enough for the maintenance engine to work out what's due. */
function fromSummary(vehicle: FleetVehicle): BoardLog[] {
  return Object.entries(vehicle.serviceSummary ?? {}).map(([type, entry]) => ({
    id: entry!.logId,
    maintenanceType: type as MaintenanceType,
    date: toDate(entry!.date),
    mileage: entry!.mileage,
    cost: 0,
    shop: "",
    tech: "",
    location: "",
    details: {},
    photos: [],
  }));
}

/** Services within one visit read in this order everywhere ("Oil Change + Tire Rotation"). */
const SERVICE_ORDER: MaintenanceType[] = ["oil_change", "tire_rotation", "tire_replacement", "brake_pads", "inspection", "cabin_filter", "other"];
const serviceRank = (type: MaintenanceType) => {
  const i = SERVICE_ORDER.indexOf(type);
  return i === -1 ? SERVICE_ORDER.length : i;
};

/**
 * A van for the board. Without `logs` it carries only its last visit (for the
 * board); with them, its whole history (for its own page).
 */
export function toBoardVan(vehicle: FleetVehicle, sites: FleetSite[], logs?: FleetLog[]): BoardVan {
  return {
    id: vehicle.id!,
    unit: vehicle.unit,
    location: siteName(sites, vehicle.siteId),
    status: vehicle.status ?? "in_service",
    statusNote: vehicle.statusNote,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    powertrain: vehicle.powertrain ?? "gas",
    plate: vehicle.licensePlate ?? "",
    vin: vehicle.vin ?? "",
    currentMileage: vehicle.currentMileage,
    estimatedAnnualMileage: vehicle.estimatedAnnualMileage || DEFAULT_ANNUAL_MILES,
    addedAt: toDate(vehicle.createdAt),
    serviceIntervals: vehicle.serviceIntervals ?? [],
    logs: logs
      ? logs
          .map((l) => fromLog(l, sites))
          .sort((a, b) => b.date.getTime() - a.date.getTime() || serviceRank(a.maintenanceType) - serviceRank(b.maintenanceType))
      : fromLastVisit(vehicle, sites),
    serviceLogs: logs ? undefined : fromSummary(vehicle),
  };
}
