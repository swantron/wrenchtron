# Wrenchtron

**Live app:** [wrenchtron.com](https://wrenchtron.com) · [Demo (no login required)](https://wrenchtron.com/demo)

A vehicle maintenance tracker for mixed fleets — cars, trucks, ATVs, mowers, snowblowers, boats. Tracks service history, calculates what's due next, and surfaces NHTSA safety recalls automatically.

---

## Features

- **Multi-vehicle fleet** — 8 vehicle types, each with type-appropriate service intervals and fields
- **Smart service scheduling** — mileage-based, time-based, seasonal, and calendar-month intervals; composite (whichever comes first) also supported
- **Maintenance history** — full log with cost tracking, receipt photo uploads, and typed detail sub-forms per service type (oil change, tires, brakes, etc.)
- **Maintenance Hub** — cross-fleet overview of everything overdue, due soon, and upcoming; timeline view
- **NHTSA recall integration** — automatic open-recall lookup by VIN on every vehicle detail page
- **Projected mileage** — estimates next-service dates based on annual mileage rate
- **PWA** — installable on iOS and Android, with offline Firestore persistence via IndexedDB
- **Dark mode** — system preference + manual toggle, persisted across sessions

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, `output: 'export'` (fully static) |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Authentication (Google sign-in) |
| Database | Firestore (client SDK, real-time subscriptions) |
| Storage | Firebase Cloud Storage (vehicle photos, receipt scans) |
| PWA | @serwist/next (service worker + offline cache) |
| Hosting | Firebase Hosting (free tier) |

**No server.** All Firebase operations run in the browser via the client SDK. Security is enforced entirely by Firestore and Storage security rules.

---

## Architecture notes

**Static export + query params** — Next.js dynamic route segments (`[id]`) break static export with `generateStaticParams`. All dynamic IDs use query parameters instead (`/vehicles/detail?id=xxx`), which works cleanly with the static build.

**Lazy Firebase initialization** — `getAuth()`, `getFirestore()`, etc. are called inside getter functions in `src/lib/firebase/config.ts`, never at module top level. This prevents prerender-time crashes during `next build`.

**Separation of concerns:**
```
src/lib/firebase/   ← pure SDK calls, not React-aware
src/hooks/          ← React hooks wrapping lib functions with useState/useEffect
src/components/     ← UI consuming hooks; no direct Firebase calls
src/utils/          ← pure functions (interval calculation, vehicle formatting)
src/types/          ← TypeScript interfaces (Vehicle, MaintenanceLog, ServiceInterval)
```

**Real-time subscriptions** — `subscribeToVehicles()` and `subscribeToMaintenanceLogs()` return Firestore unsubscribe functions. Hooks return the unsubscribe from `useEffect` cleanup. State updates go through subscription callbacks, not direct `setState` in effect bodies (enforced by ESLint).

**Service interval engine** (`src/utils/maintenance.ts`) — calculates overdue/due-soon/upcoming status for each interval type, handles projected mileage, seasonal gating, and component-based life tracking. Fully pure — no React, no Firebase, easy to unit test.

**Cost tracking** — monetary values stored as integer cents in Firestore; converted to dollars only at display time.

---

## Project structure

```
src/
  app/                  # Pages (static export, all client-rendered)
  components/
    auth/               # ProtectedRoute, sign-in
    dashboard/          # ActionableItems, fleet overview cards
    layout/             # NavBar, MobileNav, AppShell, ThemeToggle
    maintenance/        # Log list, form, typed sub-forms, receipt upload
    ui/                 # Toast, ConfirmDialog, LoadingSpinner
    vehicles/           # Detail view, form, photo upload, service panels
  hooks/                # useAuth, useVehicles, useMaintenanceLogs, useActionableItems, useRecalls
  lib/
    firebase/           # config, auth, firestore, storage
    image/              # Client-side compression before upload
    validation/         # Zod schemas for vehicle and maintenance forms
  types/                # firestore.ts (Vehicle, ServiceInterval), maintenance.ts
  utils/                # maintenance.ts (interval engine), vehicleUtils.ts
```

---

## Routes

| Path | Description |
|---|---|
| `/` | Landing page (redirects to `/vehicles` if signed in) |
| `/login` | Google sign-in |
| `/demo` | Read-only demo with sample data (no login required) |
| `/vehicles` | Fleet overview with inline service status |
| `/vehicles/new` | Add vehicle |
| `/vehicles/detail?id=xxx` | Vehicle detail, maintenance history, service schedule, recalls |
| `/vehicles/edit?id=xxx` | Edit vehicle |
| `/maintenance/new?vehicleId=xxx` | Log a service |
| `/maintenance/edit?logId=xxx&vehicleId=xxx` | Edit a log entry |
| `/hub` | Maintenance Hub — cross-fleet schedule and timeline |
| `/about` | PWA install guide + contact |

---

## Local setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Auth**, **Firestore**, and **Cloud Storage**
3. Copy `.env.local.example` → `.env.local` and fill in your Firebase config
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

```bash
npm install
npm run dev        # dev server at localhost:3000
npm run build      # static export to out/
npm run lint       # ESLint check
firebase deploy    # deploy to Firebase Hosting
```
