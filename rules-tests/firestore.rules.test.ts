import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-wrenchtron",
    firestore: { rules: readFileSync(resolve(__dirname, "../firestore.rules"), "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync(resolve(__dirname, "../storage.rules"), "utf8"), host: "127.0.0.1", port: 9199 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

// ---- Fixtures ----

const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

function member(uid: string, role: string) {
  return { uid, role, email: `${uid}@example.com`, displayName: uid, joinedAt: daysAgo(30) };
}

/** f1: owner / mgr / tech, one van with one log by tech. f2: another company. */
async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "fleets/f1"), { name: "Demo Delivery", ownerUid: "owner", sites: [], createdAt: daysAgo(30), updatedAt: daysAgo(30) });
    await setDoc(doc(db, "fleets/f1/members/owner"), member("owner", "owner"));
    await setDoc(doc(db, "fleets/f1/members/mgr"), member("mgr", "manager"));
    await setDoc(doc(db, "fleets/f1/members/tech"), member("tech", "tech"));
    await setDoc(doc(db, "fleets/f1/members/tech2"), member("tech2", "tech"));
    await setDoc(doc(db, "fleets/f1/vehicles/v1"), { unit: "Van 101", vin: "1FTBR1C80PKA00001", currentMileage: 40000, status: "in_service", siteId: "bozeman" });
    await setDoc(doc(db, "fleets/f1/vehicles/v1/maintenanceLogs/fresh"), {
      maintenanceType: "oil_change", mileage: 40000, notes: "", loggedBy: { uid: "tech", name: "tech" }, createdAt: daysAgo(0.1),
    });
    await setDoc(doc(db, "fleets/f1/vehicles/v1/maintenanceLogs/old"), {
      maintenanceType: "oil_change", mileage: 32000, notes: "", loggedBy: { uid: "tech", name: "tech" }, createdAt: daysAgo(3),
    });

    await setDoc(doc(db, "fleets/f2"), { name: "Other Co", ownerUid: "rival", sites: [], createdAt: daysAgo(30), updatedAt: daysAgo(30) });
    await setDoc(doc(db, "fleets/f2/members/rival"), member("rival", "owner"));
    await setDoc(doc(db, "fleets/f2/vehicles/v9"), { unit: "Van 9", currentMileage: 1, status: "in_service", siteId: "x" });
  });
}

function as(uid: string, email = `${uid}@example.com`, emailVerified = true): Firestore {
  const ctx: RulesTestContext = env.authenticatedContext(uid, { email, email_verified: emailVerified });
  return ctx.firestore() as unknown as Firestore;
}

const anon = () => env.unauthenticatedContext().firestore() as unknown as Firestore;

// ---- Creating a fleet ----

describe("creating a fleet", () => {
  function createBatch(db: Firestore, uid: string, fleetId: string, extra: Record<string, unknown> = {}) {
    const batch = writeBatch(db);
    batch.set(doc(db, `fleets/${fleetId}`), { name: "New Co", ownerUid: uid, sites: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra });
    batch.set(doc(db, `fleets/${fleetId}/members/${uid}`), { ...member(uid, "owner"), joinedAt: serverTimestamp() });
    batch.set(doc(db, `users/${uid}/fleetMemberships/${fleetId}`), { fleetId, fleetName: "New Co", role: "owner", joinedAt: serverTimestamp() });
    return batch;
  }

  it("works as one batch: fleet + owner member + membership pointer", async () => {
    await assertSucceeds(createBatch(as("joe"), "joe", "f3").commit());
  });

  it("rejects a fleet without its owner member doc", async () => {
    const db = as("joe");
    await assertFails(setDoc(doc(db, "fleets/f3"), { name: "New Co", ownerUid: "joe", sites: [] }));
  });

  it("rejects a fleet that sets its own billing plan", async () => {
    await assertFails(createBatch(as("joe"), "joe", "f3", { plan: { status: "active", vanLimit: 999 } }).commit());
  });

  it("rejects a fleet owned by someone else", async () => {
    await assertFails(createBatch(as("joe"), "joe", "f3", { ownerUid: "someone" }).commit());
  });

  it("rejects joining an existing fleet as owner", async () => {
    const db = as("joe");
    await assertFails(setDoc(doc(db, "fleets/f1/members/joe"), member("joe", "owner")));
  });

  it("rejects a membership pointer without a matching member doc", async () => {
    const db = as("joe");
    await assertFails(setDoc(doc(db, "users/joe/fleetMemberships/f1"), { fleetId: "f1", fleetName: "x", role: "owner" }));
  });
});

// ---- Reading ----

describe("reading", () => {
  it("members can read their fleet, its vans and logs", async () => {
    const db = as("tech");
    await assertSucceeds(getDoc(doc(db, "fleets/f1")));
    await assertSucceeds(getDoc(doc(db, "fleets/f1/vehicles/v1")));
    await assertSucceeds(getDoc(doc(db, "fleets/f1/vehicles/v1/maintenanceLogs/fresh")));
  });

  it("outsiders and signed-out visitors read nothing", async () => {
    await assertFails(getDoc(doc(as("stranger"), "fleets/f1")));
    await assertFails(getDoc(doc(as("stranger"), "fleets/f1/vehicles/v1")));
    await assertFails(getDoc(doc(anon(), "fleets/f1")));
  });

  it("a member of one fleet can't read another", async () => {
    await assertFails(getDoc(doc(as("owner"), "fleets/f2")));
    await assertFails(getDoc(doc(as("owner"), "fleets/f2/vehicles/v9")));
  });
});

// ---- Fleet settings ----

describe("updating the fleet", () => {
  it("managers can rename and edit sites", async () => {
    await assertSucceeds(updateDoc(doc(as("mgr"), "fleets/f1"), { name: "Renamed", sites: [{ id: "billings", name: "Billings" }] }));
  });

  it("nobody can set the billing plan", async () => {
    await assertFails(updateDoc(doc(as("owner"), "fleets/f1"), { plan: { status: "active", vanLimit: 999 } }));
  });

  it("techs can't edit the fleet", async () => {
    await assertFails(updateDoc(doc(as("tech"), "fleets/f1"), { name: "Renamed" }));
  });
});

// ---- Invites ----

describe("invites", () => {
  const invite = (email: string, role: string) => ({ email, role, invitedBy: "x", createdAt: serverTimestamp() });

  it("managers invite techs; only the owner invites managers", async () => {
    await assertSucceeds(setDoc(doc(as("mgr"), "fleets/f1/invites/new@example.com"), invite("new@example.com", "tech")));
    await assertFails(setDoc(doc(as("mgr"), "fleets/f1/invites/boss@example.com"), invite("boss@example.com", "manager")));
    await assertSucceeds(setDoc(doc(as("owner"), "fleets/f1/invites/boss@example.com"), invite("boss@example.com", "manager")));
  });

  it("nobody can be invited as owner", async () => {
    await assertFails(setDoc(doc(as("owner"), "fleets/f1/invites/x@example.com"), invite("x@example.com", "owner")));
  });

  it("techs can't invite", async () => {
    await assertFails(setDoc(doc(as("tech"), "fleets/f1/invites/x@example.com"), invite("x@example.com", "tech")));
  });

  it("invite ids must be the lowercased email", async () => {
    await assertFails(setDoc(doc(as("mgr"), "fleets/f1/invites/New@Example.com"), invite("New@Example.com", "tech")));
  });

  it("the invitee can read their own invite, others can't", async () => {
    await setDoc(doc(as("mgr"), "fleets/f1/invites/new@example.com"), invite("new@example.com", "tech"));
    await assertSucceeds(getDoc(doc(as("newbie", "New@Example.com"), "fleets/f1/invites/new@example.com")));
    await assertFails(getDoc(doc(as("stranger"), "fleets/f1/invites/new@example.com")));
  });
});

// ---- Accepting an invite ----

describe("accepting an invite", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "fleets/f1/invites/new@example.com"), { email: "new@example.com", role: "tech", invitedBy: "mgr", createdAt: daysAgo(1) });
    });
  });

  function acceptBatch(db: Firestore, role = "tech", consumeInvite = true) {
    const batch = writeBatch(db);
    batch.set(doc(db, "fleets/f1/members/newbie"), { ...member("newbie", role), email: "new@example.com", joinedAt: serverTimestamp() });
    batch.set(doc(db, "users/newbie/fleetMemberships/f1"), { fleetId: "f1", fleetName: "Demo Delivery", role, joinedAt: serverTimestamp() });
    if (consumeInvite) batch.delete(doc(db, "fleets/f1/invites/new@example.com"));
    return batch;
  }

  it("works with a verified matching email, consuming the invite", async () => {
    await assertSucceeds(acceptBatch(as("newbie", "new@example.com")).commit());
  });

  it("matches the invite case-insensitively", async () => {
    await assertSucceeds(acceptBatch(as("newbie", "New@Example.COM")).commit());
  });

  it("can't take a higher role than invited", async () => {
    await assertFails(acceptBatch(as("newbie", "new@example.com"), "manager").commit());
  });

  it("requires a verified email", async () => {
    await assertFails(acceptBatch(as("newbie", "new@example.com", false)).commit());
  });

  it("requires an invite for that email", async () => {
    await assertFails(acceptBatch(as("newbie", "other@example.com")).commit());
  });

  it("must consume the invite so it can't be reused", async () => {
    await assertFails(acceptBatch(as("newbie", "new@example.com"), "tech", false).commit());
  });
});

// ---- Members ----

describe("managing members", () => {
  it("the owner changes roles; managers can't", async () => {
    await assertSucceeds(updateDoc(doc(as("owner"), "fleets/f1/members/tech"), { role: "manager" }));
    await assertFails(updateDoc(doc(as("mgr"), "fleets/f1/members/tech2"), { role: "manager" }));
  });

  it("nobody can promote to owner or demote the owner", async () => {
    await assertFails(updateDoc(doc(as("owner"), "fleets/f1/members/mgr"), { role: "owner" }));
    await assertFails(updateDoc(doc(as("owner"), "fleets/f1/members/owner"), { role: "tech" }));
  });

  it("managers remove techs but not other managers", async () => {
    await assertSucceeds(deleteDoc(doc(as("mgr"), "fleets/f1/members/tech")));
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "fleets/f1/members/mgr2"), member("mgr2", "manager")));
    await assertFails(deleteDoc(doc(as("mgr"), "fleets/f1/members/mgr2")));
  });

  it("anyone but the owner can leave; nobody removes the owner", async () => {
    await assertSucceeds(deleteDoc(doc(as("tech"), "fleets/f1/members/tech")));
    await assertFails(deleteDoc(doc(as("owner"), "fleets/f1/members/owner")));
    await assertFails(deleteDoc(doc(as("mgr"), "fleets/f1/members/owner")));
  });

  it("techs can't remove anyone else", async () => {
    await assertFails(deleteDoc(doc(as("tech"), "fleets/f1/members/tech2")));
  });
});

// ---- Vehicles ----

describe("vehicles", () => {
  it("managers add and remove vans; techs can't", async () => {
    await assertSucceeds(setDoc(doc(as("mgr"), "fleets/f1/vehicles/v2"), { unit: "Van 102", currentMileage: 0, status: "in_service", siteId: "bozeman" }));
    await assertFails(setDoc(doc(as("tech"), "fleets/f1/vehicles/v3"), { unit: "Van 103", currentMileage: 0, status: "in_service", siteId: "bozeman" }));
    await assertFails(deleteDoc(doc(as("tech"), "fleets/f1/vehicles/v1")));
  });

  it("techs can record odometer and status", async () => {
    await assertSucceeds(updateDoc(doc(as("tech"), "fleets/f1/vehicles/v1"), { currentMileage: 41000, status: "at_shop", statusNote: "Brakes" }));
  });

  it("techs can't change anything else on a van", async () => {
    await assertFails(updateDoc(doc(as("tech"), "fleets/f1/vehicles/v1"), { vin: "TAMPERED" }));
    await assertFails(updateDoc(doc(as("tech"), "fleets/f1/vehicles/v1"), { siteId: "billings" }));
  });

  it("outsiders can't write vans", async () => {
    await assertFails(updateDoc(doc(as("rival"), "fleets/f1/vehicles/v1"), { currentMileage: 1 }));
  });
});

// ---- Maintenance logs ----

describe("maintenance logs", () => {
  const log = (uid: string) => ({ maintenanceType: "tire_rotation", mileage: 41000, loggedBy: { uid, name: uid }, createdAt: serverTimestamp() });

  it("any member logs work as themself", async () => {
    await assertSucceeds(setDoc(doc(as("tech"), "fleets/f1/vehicles/v1/maintenanceLogs/n1"), log("tech")));
  });

  it("can't log work as someone else", async () => {
    await assertFails(setDoc(doc(as("tech"), "fleets/f1/vehicles/v1/maintenanceLogs/n1"), log("tech2")));
  });

  it("can't backdate createdAt (it anchors the edit window)", async () => {
    await assertFails(setDoc(doc(as("tech"), "fleets/f1/vehicles/v1/maintenanceLogs/n1"), { ...log("tech"), createdAt: daysAgo(0) }));
  });

  it("authors can fix their own entry within a day", async () => {
    await assertSucceeds(updateDoc(doc(as("tech"), "fleets/f1/vehicles/v1/maintenanceLogs/fresh"), { notes: "Fixed typo" }));
  });

  it("after a day the entry is locked for its author", async () => {
    await assertFails(updateDoc(doc(as("tech"), "fleets/f1/vehicles/v1/maintenanceLogs/old"), { notes: "Changed later" }));
  });

  it("can't edit someone else's entry or reassign authorship", async () => {
    await assertFails(updateDoc(doc(as("tech2"), "fleets/f1/vehicles/v1/maintenanceLogs/fresh"), { notes: "x" }));
    await assertFails(updateDoc(doc(as("tech"), "fleets/f1/vehicles/v1/maintenanceLogs/fresh"), { loggedBy: { uid: "tech2", name: "tech2" } }));
  });

  it("only managers delete entries", async () => {
    await assertFails(deleteDoc(doc(as("tech"), "fleets/f1/vehicles/v1/maintenanceLogs/fresh")));
    await assertSucceeds(deleteDoc(doc(as("mgr"), "fleets/f1/vehicles/v1/maintenanceLogs/old")));
  });
});

// ---- Household data is unchanged ----

describe("household garage (regression)", () => {
  it("users still own their own vehicles and nobody else's", async () => {
    await assertSucceeds(setDoc(doc(as("joe"), "users/joe/vehicles/truck"), { name: "Truck" }));
    await assertFails(getDoc(doc(as("tech"), "users/joe/vehicles/truck")));
  });
});

// ---- Storage ----

describe("fleet photo storage", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  const storageAs = (uid: string) => env.authenticatedContext(uid).storage();

  it("members upload photos and PDF invoices", async () => {
    await assertSucceeds(uploadBytes(ref(storageAs("tech"), "fleets/f1/vehicles/v1/logs/n1/0.jpg"), jpeg, { contentType: "image/jpeg" }));
    await assertSucceeds(uploadBytes(ref(storageAs("tech"), "fleets/f1/vehicles/v1/logs/n1/inv.pdf"), jpeg, { contentType: "application/pdf" }));
  });

  it("outsiders can't upload", async () => {
    await assertFails(uploadBytes(ref(storageAs("rival"), "fleets/f1/vehicles/v1/logs/n1/0.jpg"), jpeg, { contentType: "image/jpeg" }));
  });

  it("only images and PDFs", async () => {
    await assertFails(uploadBytes(ref(storageAs("tech"), "fleets/f1/vehicles/v1/logs/n1/x.exe"), jpeg, { contentType: "application/octet-stream" }));
  });
});
