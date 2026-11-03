import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "./config";
import { compressImage } from "@/lib/image/compress";
import { summarizeLogs } from "@/utils/fleetSummary";
import type {
  Fleet,
  FleetInvite,
  FleetMember,
  FleetMembership,
  FleetRole,
  FleetSite,
  FleetLog,
  FleetLogPhoto,
  FleetPhotoKind,
  FleetVehicle,
  LastVisit,
  VanStatus,
} from "@/types/fleet";
import type { MaintenanceType } from "@/types/maintenance";
import type { Powertrain, ServiceInterval } from "@/types/firestore";

// ---- Paths ----

function fleetDoc(fleetId: string) {
  return doc(getFirebaseDb(), "fleets", fleetId);
}

function memberDoc(fleetId: string, uid: string) {
  return doc(getFirebaseDb(), "fleets", fleetId, "members", uid);
}

function inviteDoc(fleetId: string, email: string) {
  return doc(getFirebaseDb(), "fleets", fleetId, "invites", email.trim().toLowerCase());
}

function membershipsCollection(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "fleetMemberships");
}

// ---- Fleet ----

/** Slug-ish id for a site name, unique within the fleet. */
export function siteId(name: string, taken: string[] = []): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

/**
 * Creates a fleet with the signed-in user as owner. The fleet, the owner's member
 * doc, and their membership pointer are written in one batch — security rules
 * require all three together.
 */
export async function createFleet(user: User, name: string, siteNames: string[], ownerName = ""): Promise<string> {
  const ref = doc(collection(getFirebaseDb(), "fleets"));
  const sites: FleetSite[] = [];
  for (const siteName of siteNames.map((s) => s.trim()).filter(Boolean)) {
    sites.push({ id: siteId(siteName, sites.map((s) => s.id)), name: siteName });
  }

  const batch = writeBatch(getFirebaseDb());
  batch.set(ref, {
    name: name.trim(),
    ownerUid: user.uid,
    sites,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(memberDoc(ref.id, user.uid), {
    uid: user.uid,
    role: "owner",
    email: user.email ?? "",
    displayName: ownerName.trim() || user.displayName || user.email || "",
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(membershipsCollection(user.uid), ref.id), {
    fleetId: ref.id,
    fleetName: name.trim(),
    role: "owner",
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return ref.id;
}

export function subscribeToFleet(
  fleetId: string,
  callback: (fleet: Fleet | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    fleetDoc(fleetId),
    (snap) => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Fleet) : null),
    (error) => {
      console.error("Firestore fleet subscription error:", error);
      onError?.(error);
    }
  );
}

// ---- Membership ----

/** Whether the user belongs to any fleet (decides where "/" sends them the first time). */
export async function hasFleetMembership(uid: string): Promise<boolean> {
  const snap = await getDocs(query(membershipsCollection(uid), limit(1)));
  return !snap.empty;
}

export function subscribeToFleetMemberships(
  uid: string,
  callback: (memberships: FleetMembership[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  // A pointer from a batch that hasn't reached the server yet is left out: the
  // fleet and member docs it was written with don't exist there yet either, so
  // subscribing to the fleet would be denied (and a denied listener never retries).
  return onSnapshot(
    membershipsCollection(uid),
    { includeMetadataChanges: true },
    (snapshot) =>
      callback(
        snapshot.docs
          .filter((d) => !d.metadata.hasPendingWrites)
          .map((d) => ({ ...d.data(), fleetId: d.id }) as FleetMembership)
      ),
    (error) => {
      console.error("Firestore fleet memberships subscription error:", error);
      onError?.(error);
    }
  );
}

/** The signed-in user's member doc in a fleet — the source of truth for their role. */
export function subscribeToMember(
  fleetId: string,
  uid: string,
  callback: (member: FleetMember | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    memberDoc(fleetId, uid),
    (snap) => callback(snap.exists() ? (snap.data() as FleetMember) : null),
    (error) => {
      console.error("Firestore fleet member subscription error:", error);
      onError?.(error);
    }
  );
}

export function subscribeToMembers(
  fleetId: string,
  callback: (members: FleetMember[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), "fleets", fleetId, "members"),
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as FleetMember)),
    (error) => {
      console.error("Firestore fleet members subscription error:", error);
      onError?.(error);
    }
  );
}

/** Owner only. Security rules keep anyone from becoming or ceasing to be owner. */
export async function setMemberRole(fleetId: string, uid: string, role: Exclude<FleetRole, "owner">) {
  await updateDoc(memberDoc(fleetId, uid), { role });
}

/** Removes someone else. Their pointer to the fleet stays; they can clear it from the no-access page. */
export async function removeMember(fleetId: string, uid: string) {
  await deleteDoc(memberDoc(fleetId, uid));
}

// ---- Invites ----

/** The link to text someone you've invited. They sign in with the invited email and land on the join page. */
export function joinLink(fleetId: string): string {
  return `${window.location.origin}/fleet/join?f=${encodeURIComponent(fleetId)}`;
}

export async function createInvite(
  fleetId: string,
  fleetName: string,
  email: string,
  role: FleetInvite["role"],
  invitedBy: User
) {
  const address = email.trim().toLowerCase();
  await setDoc(inviteDoc(fleetId, address), {
    email: address,
    role,
    fleetName,
    invitedBy: invitedBy.uid,
    invitedByName: invitedBy.displayName ?? invitedBy.email ?? "",
    createdAt: serverTimestamp(),
  });
}

export async function deleteInvite(fleetId: string, email: string) {
  await deleteDoc(inviteDoc(fleetId, email));
}

export function subscribeToInvites(
  fleetId: string,
  callback: (invites: FleetInvite[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), "fleets", fleetId, "invites"),
    (snapshot) => callback(snapshot.docs.map((d) => d.data() as FleetInvite)),
    (error) => {
      console.error("Firestore fleet invites subscription error:", error);
      onError?.(error);
    }
  );
}

/** The invite addressed to this user's email, or null. Invitees can read it before they're members. */
export async function getMyInvite(fleetId: string, user: User): Promise<FleetInvite | null> {
  if (!user.email) return null;
  const snap = await getDoc(inviteDoc(fleetId, user.email));
  return snap.exists() ? (snap.data() as FleetInvite) : null;
}

/**
 * Joins the fleet on the role the invite gave. The member doc, the membership
 * pointer, and deleting the invite go in one batch — security rules require
 * the invite to be consumed so it can't be reused.
 */
export async function acceptInvite(user: User, fleetId: string, invite: FleetInvite, displayName: string) {
  const batch = writeBatch(getFirebaseDb());
  batch.set(memberDoc(fleetId, user.uid), {
    uid: user.uid,
    role: invite.role,
    email: invite.email,
    displayName: displayName.trim() || user.displayName || invite.email,
    ...(invite.siteIds ? { siteIds: invite.siteIds } : {}),
    invitedBy: invite.invitedBy,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(membershipsCollection(user.uid), fleetId), {
    fleetId,
    fleetName: invite.fleetName ?? "",
    role: invite.role,
    joinedAt: serverTimestamp(),
  });
  batch.delete(inviteDoc(fleetId, invite.email));
  await batch.commit();
}

/** Leaving a fleet yourself: the member doc and your own pointer to it. */
export async function leaveFleet(fleetId: string, uid: string) {
  const batch = writeBatch(getFirebaseDb());
  batch.delete(memberDoc(fleetId, uid));
  batch.delete(doc(membershipsCollection(uid), fleetId));
  await batch.commit();
}

/** Drops a pointer to a fleet you were removed from, so it stops showing up. */
export async function forgetFleet(uid: string, fleetId: string) {
  await deleteDoc(doc(membershipsCollection(uid), fleetId));
}

// ---- Sites ----

/** Adds sites by name, skipping ones the fleet already has (case-insensitive). Returns every site. */
export async function addSites(fleetId: string, current: FleetSite[], names: string[]): Promise<FleetSite[]> {
  const sites = [...current];
  for (const name of names.map((n) => n.trim()).filter(Boolean)) {
    if (sites.some((s) => s.name.toLowerCase() === name.toLowerCase())) continue;
    sites.push({ id: siteId(name, sites.map((s) => s.id)), name });
  }
  if (sites.length !== current.length) {
    await updateDoc(fleetDoc(fleetId), { sites, updatedAt: serverTimestamp() });
  }
  return sites;
}

// ---- Vehicles ----

function vehiclesCollection(fleetId: string) {
  return collection(getFirebaseDb(), "fleets", fleetId, "vehicles");
}

export function subscribeToFleetVehicles(
  fleetId: string,
  callback: (vehicles: FleetVehicle[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    vehiclesCollection(fleetId),
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as FleetVehicle)),
    (error) => {
      console.error("Firestore fleet vehicles subscription error:", error);
      onError?.(error);
    }
  );
}

export interface NewFleetVan {
  unit: string;
  vin: string;
  licensePlate?: string;
  siteId: string;
  currentMileage: number;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  powertrain: Powertrain;
  scheduleId: string;
  serviceIntervals: ServiceInterval[];
}

const IMPORT_BATCH = 400; // under Firestore's 500 writes per batch

/** Creates vans in batches. Each lands in service, carrying its schedule's intervals. */
export async function importFleetVans(fleetId: string, vans: NewFleetVan[]): Promise<void> {
  for (let i = 0; i < vans.length; i += IMPORT_BATCH) {
    const batch = writeBatch(getFirebaseDb());
    for (const van of vans.slice(i, i + IMPORT_BATCH)) {
      const data: Record<string, unknown> = {
        name: van.unit,
        unit: van.unit,
        type: "auto",
        powertrain: van.powertrain,
        year: van.year ?? 0,
        make: van.make ?? "",
        model: van.model ?? "",
        vin: van.vin,
        siteId: van.siteId,
        currentMileage: van.currentMileage,
        scheduleId: van.scheduleId,
        serviceIntervals: van.serviceIntervals,
        status: "in_service",
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (van.licensePlate) data.licensePlate = van.licensePlate;
      if (van.trim) data.trim = van.trim;
      if (van.engine) data.engine = van.engine;
      batch.set(doc(vehiclesCollection(fleetId)), data);
    }
    await batch.commit();
  }
}

/** Any member can mark a van down, at the shop, or back in service. */
export async function setVanStatus(fleetId: string, vehicleId: string, status: VanStatus, statusNote?: string) {
  await updateDoc(doc(vehiclesCollection(fleetId), vehicleId), {
    status,
    statusNote: status === "in_service" ? deleteField() : statusNote?.trim() || deleteField(),
    updatedAt: serverTimestamp(),
  });
}

// ---- Logging work ----

export function subscribeToVanLogs(
  fleetId: string,
  vehicleId: string,
  callback: (logs: FleetLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(vehiclesCollection(fleetId), vehicleId, "maintenanceLogs"), orderBy("date", "desc")),
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as FleetLog)),
    (error) => {
      console.error("Firestore van logs subscription error:", error);
      onError?.(error);
    }
  );
}

export interface VisitInput {
  services: { type: MaintenanceType; title?: string }[];
  date: Date;
  mileage: number;
  /** Whole visit, in cents. Recorded on the first service. */
  cost: number;
  shop: string;
  notes?: string;
  photos: { file: File; kind: FleetPhotoKind }[];
  /** Set when the visit changes whether the van can run. */
  status?: { status: VanStatus; statusNote?: string };
}

/**
 * Logs one visit: a log per service (sharing a visitId), its photos, and the
 * van's odometer, service summary, last visit and status, all in one batch so
 * the board never shows half a visit. Photos upload first; a failed upload
 * stops the visit before anything is written.
 */
export async function logVisit(
  fleetId: string,
  vehicle: FleetVehicle,
  user: User,
  /** As the fleet knows them (member doc), not the sign-in account's name. */
  userName: string,
  input: VisitInput
): Promise<string> {
  const logsCollection = collection(vehiclesCollection(fleetId), vehicle.id!, "maintenanceLogs");
  const refs = input.services.map(() => doc(logsCollection));
  const visitId = refs[0].id;

  const photos: FleetLogPhoto[] = [];
  for (const [i, photo] of input.photos.entries()) {
    const file = await compressImage(photo.file);
    const path = `fleets/${fleetId}/vehicles/${vehicle.id}/logs/${visitId}/${i + 1}-${photo.kind}.jpg`;
    const storageRef = ref(getFirebaseStorage(), path);
    await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
    photos.push({ path, url: await getDownloadURL(storageRef), kind: photo.kind });
  }

  const date = Timestamp.fromDate(input.date);
  const loggedBy = { uid: user.uid, name: userName || user.displayName || user.email || "Unknown" };
  const notes = input.notes?.trim() || undefined;
  const batch = writeBatch(getFirebaseDb());

  input.services.forEach((service, i) => {
    batch.set(refs[i], {
      maintenanceType: service.type,
      ...(service.title ? { title: service.title } : {}),
      date,
      mileage: input.mileage,
      cost: i === 0 ? input.cost : 0,
      shop: input.shop,
      ...(notes ? { notes } : {}),
      details: {},
      receiptPaths: [],
      visitId,
      loggedBy,
      siteId: vehicle.siteId,
      // The visit's photos ride on its first service
      photos: i === 0 ? photos : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const vehicleUpdate: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (input.mileage > vehicle.currentMileage) vehicleUpdate.currentMileage = input.mileage;
  input.services.forEach((service, i) => {
    const existing = vehicle.serviceSummary?.[service.type];
    if (!existing || existing.date.toMillis() <= date.toMillis()) {
      vehicleUpdate[`serviceSummary.${service.type}`] = { date, mileage: input.mileage, logId: refs[i].id };
    }
  });
  if (!vehicle.lastVisit || vehicle.lastVisit.date.toMillis() <= date.toMillis()) {
    const lastVisit: LastVisit = {
      visitId,
      date,
      mileage: input.mileage,
      types: input.services.map((s) => s.type),
      shop: input.shop,
      loggedBy,
      siteId: vehicle.siteId,
      photos,
    };
    const title = input.services.find((s) => s.title)?.title;
    if (title) lastVisit.title = title;
    if (notes) lastVisit.notes = notes;
    vehicleUpdate.lastVisit = lastVisit;
  }
  if (input.status) {
    vehicleUpdate.status = input.status.status;
    vehicleUpdate.statusNote =
      input.status.status === "in_service" ? deleteField() : input.status.statusNote?.trim() || deleteField();
  }
  batch.update(doc(vehiclesCollection(fleetId), vehicle.id!), vehicleUpdate);

  await batch.commit();
  return visitId;
}

/** Every log on every van, read once (for export). One query per van, run in parallel. */
export async function fetchFleetHistory(
  fleetId: string,
  vehicles: FleetVehicle[]
): Promise<{ vehicle: FleetVehicle; log: FleetLog }[]> {
  const perVan = await Promise.all(
    vehicles.map(async (vehicle) => {
      const snap = await getDocs(collection(vehiclesCollection(fleetId), vehicle.id!, "maintenanceLogs"));
      return snap.docs.map((d) => ({ vehicle, log: { ...d.data(), id: d.id } as FleetLog }));
    })
  );
  return perVan.flat();
}

/**
 * Deletes logged work (a visit's logs) and recomputes the van's service summary
 * and last visit from what's left, in one batch. Managers also remove the
 * photos; an author taking back a same-day mistake leaves them (Storage only
 * lets managers delete the proof).
 */
export async function deleteLogs(
  fleetId: string,
  vehicle: FleetVehicle,
  allLogs: FleetLog[],
  logIds: string[],
  removePhotos: boolean
): Promise<void> {
  const doomed = allLogs.filter((l) => logIds.includes(l.id!));
  const { serviceSummary, lastVisit } = summarizeLogs(allLogs.filter((l) => !logIds.includes(l.id!)));

  const batch = writeBatch(getFirebaseDb());
  const logsCollection = collection(vehiclesCollection(fleetId), vehicle.id!, "maintenanceLogs");
  for (const log of doomed) batch.delete(doc(logsCollection, log.id!));
  batch.update(doc(vehiclesCollection(fleetId), vehicle.id!), {
    serviceSummary,
    lastVisit: lastVisit ?? deleteField(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  if (removePhotos) {
    const paths = doomed.flatMap((l) => (l.photos ?? []).map((p) => p.path));
    // Best effort: the record is already gone, an orphaned file is harmless
    await Promise.all(paths.map((path) => deleteObject(ref(getFirebaseStorage(), path)).catch(() => {})));
  }
}

export interface VanEdit {
  unit: string;
  licensePlate: string;
  siteId: string;
  currentMileage: number;
  powertrain: Powertrain;
  scheduleId: string;
  serviceIntervals: ServiceInterval[];
}

/** Managers fix what the import got wrong: unit, plate, site, odometer, schedule. */
export async function updateFleetVan(fleetId: string, vehicleId: string, edit: VanEdit) {
  await updateDoc(doc(vehiclesCollection(fleetId), vehicleId), {
    ...edit,
    name: edit.unit,
    licensePlate: edit.licensePlate.trim() || deleteField(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Removes a van and its history (it was sold, or added by mistake). Export
 * first if the records matter. Photos stay in Storage; the logs pointing at
 * them are gone.
 */
export async function removeFleetVan(fleetId: string, vehicleId: string) {
  const logs = await getDocs(collection(vehiclesCollection(fleetId), vehicleId, "maintenanceLogs"));
  const refs = [...logs.docs.map((d) => d.ref), doc(vehiclesCollection(fleetId), vehicleId)];
  // The van doc goes last, so a partial failure leaves it visible to retry
  for (let i = 0; i < refs.length; i += IMPORT_BATCH) {
    const batch = writeBatch(getFirebaseDb());
    refs.slice(i, i + IMPORT_BATCH).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}
