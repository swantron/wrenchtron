import type { Timestamp } from "firebase/firestore";
import type { ServiceInterval, Vehicle } from "@/types/firestore";
import type { MaintenanceLog, MaintenanceType } from "@/types/maintenance";

// Fleet accounts live under fleets/{fleetId}, separate from household data in
// users/{uid}/vehicles (which utvtron also reads). See FLEET.md.

export type FleetRole = "owner" | "manager" | "tech";

export interface FleetSite {
  id: string;
  name: string;
}

/** Billing state. Set by an admin (console), never by fleet members. */
export interface FleetPlan {
  status: "pilot" | "active" | "lapsed";
  vanLimit: number;
  paidThrough?: Timestamp;
}

export interface Fleet {
  id?: string;
  name: string;
  ownerUid: string;
  sites: FleetSite[];
  plan?: FleetPlan;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FleetMember {
  uid: string;
  role: FleetRole;
  email: string;
  displayName: string;
  /** Default site filter in the UI. Not enforced by security rules. */
  siteIds?: string[];
  invitedBy?: string;
  joinedAt: Timestamp;
}

/** Keyed by lowercased email so security rules can look it up from the auth token. */
export interface FleetInvite {
  email: string;
  role: Exclude<FleetRole, "owner">;
  siteIds?: string[];
  /** Shown on the join page — the invitee can't read the fleet doc until they've joined. */
  fleetName?: string;
  invitedBy: string;
  invitedByName?: string;
  createdAt: Timestamp;
}

/** Pointer from a user to a fleet they belong to: users/{uid}/fleetMemberships/{fleetId}. */
export interface FleetMembership {
  fleetId: string;
  fleetName: string;
  role: FleetRole;
  joinedAt: Timestamp;
}

export interface FleetSchedule {
  id?: string;
  name: string;
  intervals: ServiceInterval[];
}

export type VanStatus = "in_service" | "at_shop" | "down";

/** Latest log per service type, kept on the vehicle so the board needs one listener. */
export type ServiceSummary = Partial<
  Record<MaintenanceType, { date: Timestamp; mileage: number; logId: string }>
>;

/** The van's most recent visit, kept on the vehicle so the board's Recent work needs no log queries. */
export interface LastVisit {
  visitId: string;
  date: Timestamp;
  mileage: number;
  types: MaintenanceType[];
  title?: string;
  shop: string;
  loggedBy: { uid: string; name: string };
  siteId: string;
  notes?: string;
  photos: FleetLogPhoto[];
}

export interface FleetVehicle extends Vehicle {
  unit: string;
  siteId: string;
  scheduleId?: string;
  status: VanStatus;
  statusNote?: string;
  /** The logged visit that last set the status, and what it replaced, so deleting that visit puts it back. */
  statusVisitId?: string;
  statusBefore?: { status: VanStatus; statusNote?: string };
  serviceSummary?: ServiceSummary;
  lastVisit?: LastVisit;
}

export type FleetPhotoKind = "odometer" | "part" | "invoice" | "tire" | "brake" | "damage" | "other";

export interface FleetLogPhoto {
  path: string;
  /** Download URL, saved at upload so the board doesn't resolve every thumbnail. */
  url: string;
  kind: FleetPhotoKind;
  caption?: string;
}

export interface FleetLog extends MaintenanceLog {
  /** Groups the services from one shop visit. */
  visitId: string;
  /** Shown instead of the maintenance type, e.g. "Damage report". */
  title?: string;
  loggedBy: { uid: string; name: string };
  siteId: string;
  photos: FleetLogPhoto[];
}
