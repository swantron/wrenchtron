import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "./config";
import type { Fleet, FleetMember, FleetMembership, FleetSite } from "@/types/fleet";

// ---- Paths ----

function fleetDoc(fleetId: string) {
  return doc(getFirebaseDb(), "fleets", fleetId);
}

function memberDoc(fleetId: string, uid: string) {
  return doc(getFirebaseDb(), "fleets", fleetId, "members", uid);
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
export async function createFleet(user: User, name: string, siteNames: string[]): Promise<string> {
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
    displayName: user.displayName ?? user.email ?? "",
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

export function subscribeToFleetMemberships(
  uid: string,
  callback: (memberships: FleetMembership[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    membershipsCollection(uid),
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), fleetId: d.id }) as FleetMembership)),
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
