"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ServicePhoto } from "@/components/fleet/ServicePhoto";
import {
  generateFleet,
  FLEET_LOCATIONS,
  type FleetLocation,
  type FleetLog,
  type FleetPhoto,
  type FleetVan,
  type VanStatus,
} from "@/data/fleetDemoData";
import { calculateActionItems, type ActionItem } from "@/utils/maintenance";
import { formatRelativeTime } from "@/utils/vehicleUtils";
import { formatCost } from "@/utils/format";
import { TYPE_LABELS } from "@/utils/export";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";

const DAY_MS = 24 * 60 * 60 * 1000;

interface VanSummary {
  van: FleetVan;
  items: ActionItem[];
  worst: ActionItem["status"] | null;
  photoCount: number;
}

function toVehicle(van: FleetVan, now: Date): Vehicle {
  return {
    id: van.id,
    name: van.unit,
    type: "auto",
    powertrain: van.powertrain,
    year: van.year,
    make: van.make,
    model: van.model,
    currentMileage: van.currentMileage,
    estimatedAnnualMileage: van.estimatedAnnualMileage,
    isActive: true,
    // Odometer was just synced, so no projection on top of it
    createdAt: Timestamp.fromDate(van.addedAt),
    updatedAt: Timestamp.fromDate(now),
    serviceIntervals: van.serviceIntervals,
  };
}

function toLogs(van: FleetVan): MaintenanceLog[] {
  return van.logs.map((l) => ({
    id: l.id,
    maintenanceType: l.maintenanceType,
    date: Timestamp.fromDate(l.date),
    mileage: l.mileage,
    cost: l.cost,
    shop: l.shop,
    notes: l.notes,
    details: l.details,
    receiptPaths: [],
    createdAt: Timestamp.fromDate(l.date),
    updatedAt: Timestamp.fromDate(l.date),
  }));
}

function summarize(van: FleetVan, now: Date): VanSummary {
  const items = calculateActionItems(toVehicle(van, now), toLogs(van));
  return {
    van,
    items,
    worst: items[0]?.status ?? null,
    photoCount: van.logs.reduce((n, l) => n + l.photos.length, 0),
  };
}

// The fleet is anchored to the viewer's clock, so render client-only to avoid hydration drift
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const VAN_STATUS: Record<VanStatus, { label: string; className: string }> = {
  in_service: {
    label: "In service",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  at_shop: {
    label: "At shop",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  down: {
    label: "Down",
    className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

const DUE_TEXT: Record<ActionItem["status"], string> = {
  overdue: "text-red-600 dark:text-red-400",
  due_soon: "text-amber-600 dark:text-amber-400",
  upcoming: "text-gray-500 dark:text-gray-400",
};

function StatusBadge({ status }: { status: VanStatus }) {
  const s = VAN_STATUS[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${s.className}`}>{s.label}</span>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-black tabular-nums text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

interface LightboxState {
  photo: FleetPhoto;
  log: FleetLog;
  unit: string;
}

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const { photo, log, unit } = state;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-[4/3] bg-black">
          <ServicePhoto photo={photo} takenAt={log.date} />
        </div>
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-lg font-black text-gray-900 dark:text-white">{photo.caption}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {unit} · {TYPE_LABELS[log.maintenanceType]} · {log.date.toLocaleDateString()} ·{" "}
              {log.mileage.toLocaleString()} mi
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Logged by <span className="font-semibold text-gray-700 dark:text-gray-300">{log.tech}</span> · {log.shop}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoStrip({
  log,
  unit,
  onOpen,
  max,
}: {
  log: FleetLog;
  unit: string;
  onOpen: (s: LightboxState) => void;
  max?: number;
}) {
  const photos = max ? log.photos.slice(0, max) : log.photos;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onOpen({ photo, log, unit })}
          className="aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-gray-200 transition hover:ring-2 hover:ring-blue-500 dark:ring-gray-700"
          aria-label={`View photo: ${photo.caption}`}
        >
          <ServicePhoto photo={photo} takenAt={log.date} />
        </button>
      ))}
    </div>
  );
}

function ProofFeed({
  summaries,
  onOpen,
  onSelect,
}: {
  summaries: VanSummary[];
  onOpen: (s: LightboxState) => void;
  onSelect: (id: string) => void;
}) {
  const recent = summaries
    .flatMap((s) => s.van.logs.map((log) => ({ log, van: s.van })))
    .sort((a, b) => b.log.date.getTime() - a.log.date.getTime())
    .slice(0, 8);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-black text-gray-900 dark:text-white">Proof feed</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Latest work across every location, with photos.</p>
      <div className="mt-4 space-y-5">
        {recent.map(({ log, van }) => (
          <div key={log.id}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <button onClick={() => onSelect(van.id)} className="text-left text-sm font-bold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                {van.unit} · {TYPE_LABELS[log.maintenanceType]}
              </button>
              <span className="shrink-0 text-xs text-gray-400">{formatRelativeTime(log.date)}</span>
            </div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              {van.location} · {log.tech} · {log.photos.length} photos
            </p>
            <PhotoStrip log={log} unit={van.unit} onOpen={onOpen} max={3} />
          </div>
        ))}
      </div>
    </section>
  );
}

function FleetTable({
  summaries,
  onSelect,
}: {
  summaries: VanSummary[];
  onSelect: (id: string) => void;
}) {
  if (summaries.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No vans match.</p>;
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_1.6fr_0.8fr] gap-4 px-4 pb-2 text-xs font-bold uppercase tracking-widest text-gray-400 md:grid">
        <span>Van</span>
        <span>Status</span>
        <span className="text-right">Odometer</span>
        <span>Next due</span>
        <span className="text-right">Last service</span>
      </div>
      {summaries.map(({ van, items, photoCount }) => {
        const next = items[0];
        const last = van.logs[0];
        return (
          <button
            key={van.id}
            onClick={() => onSelect(van.id)}
            className="grid w-full grid-cols-2 gap-x-4 gap-y-1 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/60 md:grid-cols-[1.4fr_0.8fr_0.8fr_1.6fr_0.8fr] md:items-center"
          >
            <span>
              <span className="block font-bold text-gray-900 dark:text-white">{van.unit}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {van.location} · {van.make} {van.model}
              </span>
            </span>
            <span className="justify-self-end md:justify-self-start">
              <StatusBadge status={van.status} />
            </span>
            <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300 md:text-right">
              {van.currentMileage.toLocaleString()} mi
            </span>
            <span className={`col-span-2 text-sm md:col-span-1 ${next ? DUE_TEXT[next.status] : "text-gray-400"}`}>
              {next ? (
                <>
                  <span className="font-semibold">{next.serviceName}</span> — {next.reason}
                </>
              ) : (
                "Nothing scheduled"
              )}
            </span>
            <span className="col-span-2 text-xs text-gray-500 dark:text-gray-400 md:col-span-1 md:text-right">
              {last ? `${formatRelativeTime(last.date)} · ${photoCount} photos` : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function VanDetail({
  summary,
  onBack,
  onOpen,
}: {
  summary: VanSummary;
  onBack: () => void;
  onOpen: (s: LightboxState) => void;
}) {
  const { van, items } = summary;
  const totalCost = van.logs.reduce((n, l) => n + l.cost, 0);

  return (
    <div>
      <button onClick={onBack} className="mb-6 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
        ← Back to fleet
      </button>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">{van.unit}</h1>
            <StatusBadge status={van.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            {van.year} {van.make} {van.model} · {van.plate} · {van.location}
          </p>
          {van.statusNote && <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">{van.statusNote}</p>}
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Odometer</p>
            <p className="text-xl font-black tabular-nums text-gray-900 dark:text-white">{van.currentMileage.toLocaleString()} mi</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Spend on record</p>
            <p className="text-xl font-black tabular-nums text-gray-900 dark:text-white">{formatCost(totalCost)}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Service schedule</h2>
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 py-2 text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">{item.serviceName}</span>
              <span className={DUE_TEXT[item.status]}>{item.reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Service history</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Every entry carries its own proof: odometer, parts installed, and the invoice.
        </p>
        <div className="mt-4 space-y-4">
          {van.logs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{TYPE_LABELS[log.maintenanceType]}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {log.date.toLocaleDateString()} · {log.mileage.toLocaleString()} mi · {log.shop}
                  </p>
                  <p className="text-xs text-gray-400">Logged by {log.tech}</p>
                </div>
                <p className="text-lg font-black tabular-nums text-gray-900 dark:text-white">{formatCost(log.cost)}</p>
              </div>
              {log.notes && <p className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">&ldquo;{log.notes}&rdquo;</p>}
              <div className="mt-4">
                <PhotoStrip log={log} unit={van.unit} onOpen={onOpen} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function FleetOverview({
  summaries,
  now,
  location,
  onLocation,
  onSelect,
  onOpen,
}: {
  summaries: VanSummary[];
  now: Date;
  location: FleetLocation | null;
  onLocation: (l: FleetLocation | null) => void;
  onSelect: (id: string) => void;
  onOpen: (s: LightboxState) => void;
}) {
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);

  const scoped = location ? summaries.filter((s) => s.van.location === location) : summaries;
  const q = query.trim().toLowerCase();
  const visible = scoped
    .filter((s) => !attentionOnly || s.van.status !== "in_service" || s.worst === "overdue" || s.worst === "due_soon")
    .filter((s) => !q || `${s.van.unit} ${s.van.plate} ${s.van.make} ${s.van.model}`.toLowerCase().includes(q));

  const thirtyDaysAgo = now.getTime() - 30 * DAY_MS;
  const photos30 = scoped.reduce(
    (n, s) => n + s.van.logs.filter((l) => l.date.getTime() >= thirtyDaysAgo).reduce((m, l) => m + l.photos.length, 0),
    0
  );
  const inService = scoped.filter((s) => s.van.status === "in_service").length;
  const overdue = scoped.reduce((n, s) => n + s.items.filter((i) => i.status === "overdue").length, 0);
  const dueSoon = scoped.reduce((n, s) => n + s.items.filter((i) => i.status === "due_soon").length, 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Fleet</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Demo Delivery Co. · sample data</p>
        <p className="mt-3 max-w-2xl text-base font-medium text-gray-600 dark:text-gray-300">
          Every service on every van, with photo proof: the odometer, the part that went in, and the invoice. See it
          from anywhere, whether the work happened in Bozeman, Billings, or Helena.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[null, ...FLEET_LOCATIONS].map((loc) => {
          const count = loc ? summaries.filter((s) => s.van.location === loc).length : summaries.length;
          const active = location === loc;
          return (
            <button
              key={loc ?? "all"}
              onClick={() => onLocation(loc)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${active
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:text-gray-900 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:text-white"
                }`}
            >
              {loc ?? "All locations"} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="In service" value={`${inService}/${scoped.length}`} sub={`${scoped.length - inService} at shop or down`} />
        <StatTile label="Overdue" value={overdue} sub="services past due" />
        <StatTile label="Due soon" value={dueSoon} sub="within 30 days / 500 mi" />
        <StatTile label="Photos" value={photos30} sub="logged in the last 30 days" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search unit, plate, model"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-xs"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={attentionOnly} onChange={(e) => setAttentionOnly(e.target.checked)} className="h-4 w-4 rounded" />
              Needs attention only
            </label>
          </div>
          <FleetTable summaries={visible} onSelect={onSelect} />
        </section>

        <ProofFeed summaries={scoped} onOpen={onOpen} onSelect={onSelect} />
      </div>

      <div className="mt-16 overflow-hidden rounded-[2rem] bg-gray-900 p-1 shadow-2xl">
        <div className="rounded-[1.8rem] border border-white/5 bg-gray-800/50 p-10 text-center">
          <h3 className="text-2xl font-black text-white">Want this for your fleet?</h3>
          <p className="mx-auto mt-4 max-w-md text-lg font-medium text-gray-400">
            Send a list of VINs and we&apos;ll load your vans. Bring your own photos from day one.
          </p>
          <a
            href="mailto:joe@swantron.com?subject=Wrenchtron%20for%20our%20fleet"
            className="mt-8 inline-block rounded-2xl bg-white px-10 py-4 text-sm font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-gray-100 active:scale-95"
          >
            Get in touch
          </a>
        </div>
      </div>
    </>
  );
}

export function FleetDemo() {
  const isClient = useIsClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const { now, summaries } = useMemo(() => {
    const now = new Date();
    return { now, summaries: isClient ? generateFleet(now).map((van) => summarize(van, now)) : [] };
  }, [isClient]);

  const selectedId = searchParams.get("van");
  const locParam = searchParams.get("loc");
  const location = FLEET_LOCATIONS.find((l) => l === locParam) ?? null;
  const selected = summaries.find((s) => s.van.id === selectedId);

  const navigate = (params: { van?: string | null; loc?: FleetLocation | null }) => {
    const next = new URLSearchParams();
    const loc = params.loc === undefined ? location : params.loc;
    if (loc) next.set("loc", loc);
    if (params.van) next.set("van", params.van);
    const qs = next.toString();
    router.push(`/demo/fleet${qs ? `?${qs}` : ""}`, { scroll: !!params.van });
  };

  return (
    <AppShell isDemo={true} demoActiveTab="fleet">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!isClient ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner />
          </div>
        ) : selected ? (
          <VanDetail summary={selected} onBack={() => navigate({ van: null })} onOpen={setLightbox} />
        ) : (
          <FleetOverview
            summaries={summaries}
            now={now}
            location={location}
            onLocation={(loc) => navigate({ loc })}
            onSelect={(van) => navigate({ van })}
            onOpen={setLightbox}
          />
        )}
      </div>
      {lightbox && <Lightbox state={lightbox} onClose={() => setLightbox(null)} />}
    </AppShell>
  );
}
