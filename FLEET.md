# wrenchtron fleet — build plan

**Status:** phase 1 done. Rules deployed and tested (43 emulator tests, run in CI before deploy). Phase 2 next (Oct 2026)
**Goal:** a delivery fleet can run a paid pilot on real data: the owner loads the vans, techs and partner shops log work with photos from a phone, and the owner sees the board from anywhere.
**Reference UI:** `/demo/fleet` (sample data). The real fleet app should look and behave like it.

---

## Scope

| In the pilot | Out, on purpose (until a paying customer asks) |
|---|---|
| Shared fleet account: owner, managers, techs, partner shops | Driver pre-trip / DVIR, route release |
| Sites (Bozeman, Billings, Helena…) and van status: in service / at shop / down | Telematics, fuel, GPS |
| Bulk VIN import, fleet-wide service schedules | Work orders, parts room, vendor POs |
| Phone logging: one visit, several services, labeled photos | Per-seat pricing, in-app checkout |
| Board on real data: next due, overdue, needs attention, recent work | Native apps (the PWA is enough) |
| Weekly "what's due" email, CSV export | |

---

## Key decision: fleets get their own tree; household data is untouched

`users/{uid}/vehicles/...` stays exactly as it is. **utvtron reads and writes that same path** (`utvtron/src/lib/firebase/vehicles.ts`, `sessions.ts`, `maintenance.ts`), so moving household data would break it. Fleets live under a new top-level `fleets/` collection. No migration, and no risk to existing users.

The interval engine (`src/utils/maintenance.ts`) already works on any `Vehicle` + `MaintenanceLog[]`, so fleets reuse it unchanged.

---

## Data model

```
fleets/{fleetId}
  name, ownerUid, createdAt
  sites: [{ id, name }]                      // "Bozeman", "Billings"
  plan: { status: "pilot" | "active" | "lapsed", vanLimit, paidThrough }

fleets/{fleetId}/members/{uid}
  role: "owner" | "manager" | "tech"
  email, displayName, siteIds?: string[]     // siteIds = UI default, not enforced in v1
  invitedBy, joinedAt

fleets/{fleetId}/invites/{emailLowercase}    // keyed by email so rules can look it up
  role, siteIds?, invitedBy, createdAt

fleets/{fleetId}/schedules/{scheduleId}      // fleet-wide interval templates
  name ("Gas van — severe duty"), intervals: ServiceInterval[]

fleets/{fleetId}/vehicles/{vehicleId}
  …existing Vehicle fields (year/make/model/vin/plate/currentMileage/…)
  unit ("Van 117"), siteId, scheduleId
  status: "in_service" | "at_shop" | "down", statusNote?
  serviceSummary: { [MaintenanceType]: { date, mileage, logId } }   // see "Reads" below

fleets/{fleetId}/vehicles/{vehicleId}/maintenanceLogs/{logId}
  …existing MaintenanceLog fields
  visitId                                    // groups services from one shop visit
  loggedBy: { uid, name }, shop, siteId
  photos: [{ path, kind: "odometer"|"part"|"invoice"|"tire"|"brake"|"damage"|"other", caption? }]

users/{uid}/fleetMemberships/{fleetId}       // so the app can find a user's fleets
  role, fleetName, joinedAt
```

**Reads.** The board must not open 80 listeners on log subcollections. Each vehicle doc carries a `serviceSummary` (the latest log per service type). It's written in the same batch as each log, and recomputed from that one van's logs on edit or delete. The board then needs **one listener on `vehicles`**. It feeds the engine with minimal logs built from the summary. Full log history loads only on a van's detail page.

**Photos.** `fleets/{fleetId}/vehicles/{vehicleId}/logs/{logId}/{n}.jpg`, compressed client-side with the existing `browser-image-compression`. Invoices may be PDFs.

---

## Auth and invites (no server needed)

- Add **email-link (passwordless) sign-in** next to Google. Techs and partner shops won't all have Google accounts, and Firebase sends the sign-in email itself.
- **Invite flow:** an owner or manager adds an email and role. That writes `invites/{email}`, and the app shows a join link (`/fleet/join?f={fleetId}`) to text to the person. They sign in with that email. Accepting creates `members/{uid}` and `users/{uid}/fleetMemberships/{fleetId}` in one batch.
- **Rules** allow that member create only if `invites/{request.auth.token.email}` exists, `email_verified` is true, and the role matches the invite. The invite is deleted in the same batch.

---

## Security rules (the only backend, so they get real tests)

Helpers: `isMember(f)`, `role(f)`, `isManager(f)` (owner or manager).

| Path | Read | Write |
|---|---|---|
| `fleets/{f}` | member | owner (create: `ownerUid == auth.uid`) |
| `members/{uid}` | member | owner/manager; self-create via valid invite; owner can't be removed |
| `invites/{email}` | manager, or the invitee (`auth.token.email`) | manager create/delete; invitee delete on accept |
| `schedules/*` | member | manager |
| `vehicles/{v}` | member | manager full; **tech may update only** `currentMileage`, `status`, `statusNote`, `serviceSummary`, `updatedAt` |
| `maintenanceLogs/{l}` | member | create: any member with `loggedBy.uid == auth.uid`; update: manager, or the author within 24h; delete: manager |
| Storage `fleets/{f}/**` | member (via `firestore.exists`) | member; < 10 MB; `image/*` or `application/pdf` |

**Tests:** Firebase emulator plus `@firebase/rules-unit-testing` under vitest. Cover each row above, especially: a tech can't edit vans or delete logs, a non-member can't read anything, a forged invite can't be accepted, and a member of fleet A can't touch fleet B.

---

## Routes (query params, matching the static-export constraint)

| Route | Who | What |
|---|---|---|
| `/fleet` | member | Board: sites, summary line, table sorted by next due, recent work (reuses `/demo/fleet` components) |
| `/fleet/van?id=` | member | Van detail: coming up, visit history with photos, status change |
| `/fleet/log?van=` | member | **Phone-first logging:** odometer → services (multi-select) → labeled photos → save as one visit |
| `/fleet/import` | manager | Paste or upload VINs (+ unit, plate, site), batch-decode via NHTSA, pick a schedule, review, create |
| `/fleet/settings` | manager | Members and invites, sites, schedules, CSV export |
| `/fleet/join?f=` | invitee | Sign in with email, accept invite |
| `/fleet/new` | anyone signed in | Create a fleet (in the pilot, Joe creates it for the customer) |

Refactor `src/components/fleet/FleetDemo.tsx` into data-agnostic pieces (`FleetTable`, `VanDetail`, `Thumbs`, `Lightbox`, `RecentWork`) that the demo feeds sample data and `/fleet` feeds Firestore. `ServicePhoto` already renders a real `src`.

---

## Weekly email (first server code)

- A **Cloud Function** on a schedule (Monday 6am Mountain). It reads each active fleet's vehicles, runs the same engine, and emails managers: overdue, due this week, vans down or at the shop, with links to `/fleet/van`.
- Requires the **Blaze plan**. Set a **budget alert** first. Cost at this scale is pennies.
- Email via a transactional provider (Resend or Postmark). The API key lives in Functions secrets.
- **Not** a GitHub Actions cron with a service-account key. After the Oct 8 compromise, no long-lived Firebase admin keys in CI.

---

## Build order

Each phase ends deployable and is checked against the "Done when" line.

1. **Foundation:** fleet types, Firestore helpers (`src/lib/firebase/fleet.ts`), security rules plus the emulator test suite, a `useFleet` hook, and fleet switching for users in more than one fleet.
   *Done when:* the rules tests pass and Joe can create a fleet from `/fleet/new`.
2. **People:** email-link sign-in, invites, join flow, member list with roles.
   *Done when:* a second account accepts an invite and sees the empty fleet; a non-invited account sees nothing.
3. **Vans:** bulk VIN import, sites, schedules, van status, `serviceSummary` upkeep.
   *Done when:* 80 VINs pasted in become 80 vans on the right schedule in one pass.
4. **Board:** `/fleet` and `/fleet/van` on real data, reusing the demo components.
   *Done when:* the real board matches the demo with the same counts, sort and filters.
5. **Logging:** `/fleet/log` on a phone, with visits, labeled photos and PDF invoices.
   *Done when:* a tech on a phone logs oil + rotation with three photos in under a minute, and it shows on the owner's board.
6. **Email and export:** the weekly digest function and CSV export.
   *Done when:* a manager gets Monday's email with correct overdue vans.

**Phases 1–3 are the minimum to say yes to a pilot** (vans loaded, people invited). Phases 4–5 must land before the first tech logs anything. Phase 6 can follow in the first pilot weeks.

---

## Before a business depends on it (not code)

- **Backups:** enable Firestore point-in-time recovery, or a scheduled export.
- **LLC and a short terms of service:** a service record, not a safety guarantee; data export on request.
- **Billing:** a Stripe invoice for the pilot, and a `plan` field on the fleet doc. No checkout.
- **Data export promise:** CSV of every van and log, any time.

---

## Open questions for the customer

1. Do partner shops log directly (an account each) or send photos for someone in the yard to enter?
2. Should techs see only their site, or the whole fleet?
3. Who gets the Monday email?
4. Their real service intervals: severe-duty oil at 5k or 7.5k? Rivian service handled by Rivian?
