# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Wrenchtron

Vehicle maintenance tracker. Next.js 15 static export + Firebase (Auth, Firestore, Cloud Storage).

## Commands

- `npm run build` — static export to `out/` (the primary verification step)
- `npm run dev` — dev server on localhost:3000
- `npm run lint` — ESLint (no auto-fix; redirect output to `lint_output.txt` if needed — it's gitignored)

There is no test framework configured.

## Architecture

**Static export (`output: 'export'`)** — no server-side rendering, no API routes. All Firebase operations are client-side. Security is enforced by Firestore/Storage rules, not middleware.

**Firebase SDK is lazily initialized** via getter functions in `src/lib/firebase/config.ts`. Never use top-level `const auth = getAuth()` — it breaks the build by running during prerender.

### Separation of concerns

- `src/lib/firebase/` — pure Firebase SDK calls, not React-aware
- `src/hooks/` — React hooks that wrap lib functions with state management
- `src/components/` — UI components that consume hooks
- `src/types/` — TypeScript type definitions (Vehicle, MaintenanceLog, etc.)
- `src/utils/` — Pure utility functions (maintenance alert calculation, vehicle formatting)

### Routing

Dynamic route segments (`[vehicleId]`) don't work with static export + empty `generateStaticParams` (known Next.js bug). All dynamic IDs use **query parameters** instead:

- `/vehicles/detail?id=xxx` — vehicle detail
- `/vehicles/edit?id=xxx` — edit vehicle
- `/maintenance/new?vehicleId=xxx` — log maintenance
- `/maintenance/edit?id=xxx` — edit maintenance log

Pages using `useSearchParams()` must be wrapped in `<Suspense>`.

### Firestore schema

```
users/{userId}/vehicles/{vehicleId}
users/{userId}/vehicles/{vehicleId}/maintenanceLogs/{logId}
```

User-scoped subcollections. Security rules match `request.auth.uid == userId`.

### Maintenance types

Discriminated union on `maintenanceType` field. 15 types defined in `src/types/maintenance.ts`. `oil_change`, `tire_rotation`/`tire_replacement`, and `brake_pads`/`brake_rotors` have dedicated detail sub-forms (`OilChangeFields`, `TireFields`, `BrakeFields`). All others use a generic details object.

### Real-time subscriptions

`subscribeToVehicles()` and `subscribeToMaintenanceLogs()` return Firestore unsubscribe functions. In hooks, always return the unsubscribe from `useEffect` for cleanup. Don't call `setState` directly in the effect body — pass a callback to the subscription instead (ESLint enforces `react-hooks/set-state-in-effect`).

### Service intervals

`ServiceInterval` on a vehicle defines the maintenance schedule. `useActionableItems` calculates overdue/due-soon/upcoming alerts by comparing intervals against the last matching maintenance log. Calculation logic lives in `src/utils/maintenance.ts`.

## Gotchas

- **`manifest.ts` doesn't work with static export.** Use `public/manifest.json` instead.
- **`next/font/google` doesn't work with static export.** Use `system-ui` or self-hosted fonts.
- **`public/sw.js` is build-generated** by @serwist/next. It's in `.gitignore` and `tsconfig.json` exclude. Don't edit it.
- **`enableIndexedDbPersistence`** is called once in `getFirebaseDb()` for offline support. It's guarded by `typeof window !== "undefined"`.
- **Cost is stored in cents** (integer) in Firestore. Convert to dollars for display: `(cents / 100).toFixed(2)`.
- **eslint-config-next 15.x** enforces `react-hooks/set-state-in-effect` — don't call `setState` directly in useEffect bodies. Use callbacks from subscriptions or derive values instead.
- **`.env.local.example`** is committed as a template. Actual `.env.local` is gitignored.
- **All NEXT_PUBLIC_ env vars are client-side only** — this is intentional since there's no server. Firebase security rules handle access control.
