import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "./config";
import type { Fleet, FleetInvite, FleetMember, FleetMembership, FleetRole, FleetSite } from "@/types/fleet";

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
export async function acceptInvite(user: User, fleetId: string, invite: FleetInvite) {
  const batch = writeBatch(getFirebaseDb());
  batch.set(memberDoc(fleetId, user.uid), {
    uid: user.uid,
    role: invite.role,
    email: invite.email,
    displayName: user.displayName || invite.email,
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
