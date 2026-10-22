"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
import { formatCost } from "@/utils/format";
import { TYPE_LABELS } from "@/utils/export";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";

const DAY_MS = 24 * 60 * 60 * 1000;
const CONTACT_HREF = "mailto:joe@swantron.com?subject=Wrenchtron%20for%20our%20fleet";

// ---- Derived data ----

/** One trip to the shop: every service logged for a van on the same day at the same place. */
interface Visit {
  id: string;
  date: Date;
  mileage: number;
  shop: string;
  tech: string;
  location: FleetLocation;
  logs: FleetLog[];
  photos: FleetPhoto[];
  cost: number;
  notes: string[];
}

interface VanSummary {
  van: FleetVan;
  items: ActionItem[];
  next: ActionItem | undefined;
  /** Days until the most urgent item is due (negative = overdue). */
  urgency: number;
  visits: Visit[];
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
    createdAt: Timestamp.fromDate(van.addedAt),
    // Odometer was just synced, so no projection on top of it
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

function groupVisits(van: FleetVan): Visit[] {
  const visits: Visit[] = [];
  for (const log of van.logs) {
    const prev = visits[visits.length - 1];
    if (prev && prev.date.toDateString() === log.date.toDateString() && prev.shop === log.shop) {
      prev.logs.push(log);
      prev.cost += log.cost;
      if (log.notes) prev.notes.push(log.notes);
      // One odometer shot per visit is enough
      prev.photos.push(...log.photos.filter((p) => p.kind !== "odometer"));
      continue;
    }
    visits.push({
      id: log.id,
      date: log.date,
      mileage: log.mileage,
      shop: log.shop,
      tech: log.tech,
      location: log.location,
      logs: [log],
      photos: [...log.photos],
      cost: log.cost,
      notes: log.notes ? [log.notes] : [],
    });
  }
  return visits;
}

function daysUntil(item: ActionItem, dailyMiles: number): number {
  const byMiles = item.remainingMiles !== undefined ? item.remainingMiles / dailyMiles : Infinity;
  const byDays = item.remainingDays ?? Infinity;
  return Math.min(byMiles, byDays);
}

function summarize(van: FleetVan, now: Date): VanSummary {
  const daily = van.estimatedAnnualMileage / 365;
  const items = calculateActionItems(toVehicle(van, now), toLogs(van)).sort(
    (a, b) => daysUntil(a, daily) - daysUntil(b, daily)
  );
  const visits = groupVisits(van);
  return {
    van,
    items,
    next: items[0],
    urgency: items[0] ? daysUntil(items[0], daily) : Infinity,
    visits,
    photoCount: visits.reduce((n, v) => n + v.photos.length, 0),
  };
}

// ---- Formatting ----

function sentenceCase(name: string): string {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

function plural(n: number, unit: string): string {
  return `${n.toLocaleString()} ${unit}${n === 1 ? "" : "s"}`;
}

/** Compact due label using whichever limit (miles or days) comes first. */
function dueLabel(item: ActionItem, dailyMiles: number): string {
  const byMiles = item.remainingMiles !== undefined ? item.remainingMiles / dailyMiles : Infinity;
  const byDays = item.remainingDays ?? Infinity;
  const useMiles = byMiles <= byDays;
  const value = useMiles ? item.remainingMiles! : item.remainingDays!;
  const amount = useMiles ? `${Math.abs(value).toLocaleString()} mi` : plural(Math.abs(value), "day");
  return value < 0 ? `${amount} overdue` : `in ${amount}`;
}

function shortDate(date: Date, withYear = false): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear && { year: "numeric" }) });
}

function ago(date: Date, now: Date): string {
  const days = Math.floor((now.getTime() - date.getTime()) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return shortDate(date);
}

function visitTitle(visit: Visit): string {
  return visit.logs.map((l) => TYPE_LABELS[l.maintenanceType]).join(" + ");
}

// The fleet is anchored to the viewer's clock, so render client-only to avoid hydration drift
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// ---- Small pieces ----

const DOT: Record<ActionItem["status"], string> = {
  overdue: "bg-red-500",
  due_soon: "bg-amber-400",
  upcoming: "bg-stone-300 dark:bg-stone-600",
};

const VAN_STATUS: Record<VanStatus, { label: string; className: string }> = {
  // Most vans are in service; only the exceptions get a label
  in_service: { label: "", className: "" },
  at_shop: { label: "At shop", className: "text-amber-700 dark:text-amber-400 font-medium" },
  down: { label: "Down", className: "text-red-600 dark:text-red-400 font-medium" },
};

function DueCell({ summary }: { summary: VanSummary }) {
  const { next, van } = summary;
  if (!next) return <span className="text-stone-400">—</span>;
  const daily = van.estimatedAnnualMileage / 365;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[next.status]}`} />
      <span className="text-stone-900 dark:text-stone-100">{sentenceCase(next.serviceName)}</span>
      <span className={next.status === "overdue" ? "text-red-600 dark:text-red-400" : "text-stone-500 dark:text-stone-400"}>
        {dueLabel(next, daily)}
      </span>
    </span>
  );
}

interface LightboxState {
  photo: FleetPhoto;
  visit: Visit;
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

  const { photo, visit, unit } = state;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption}
    >
      <figure className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-[4/3] overflow-hidden rounded-md bg-black">
          <ServicePhoto photo={photo} takenAt={visit.date} showCaption />
        </div>
        <figcaption className="mt-3 flex items-start justify-between gap-4 text-sm text-stone-300">
          <span>
            <span className="font-medium text-white">{unit}</span> · {visitTitle(visit)} · {shortDate(visit.date, true)} ·{" "}
            {visit.mileage.toLocaleString()} mi
            <br />
            Logged by {visit.tech} · {visit.shop}
          </span>
          <button onClick={onClose} className="shrink-0 text-stone-400 underline-offset-4 hover:text-white hover:underline">
            Close
          </button>
        </figcaption>
      </figure>
    </div>
  );
}

function Thumbs({
  visit,
  unit,
  onOpen,
  size = "sm",
}: {
  visit: Visit;
  unit: string;
  onOpen: (s: LightboxState) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {visit.photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onOpen({ photo, visit, unit })}
          className={`${size === "md" ? "w-32 sm:w-36" : "w-16"} aspect-[4/3] overflow-hidden rounded-[3px] outline-offset-2 hover:outline hover:outline-2 hover:outline-stone-900 dark:hover:outline-stone-100`}
          aria-label={`View photo: ${photo.caption}`}
          title={photo.caption}
        >
          <ServicePhoto photo={photo} takenAt={visit.date} />
        </button>
      ))}
    </div>
  );
}

// ---- Views ----

function FleetHeader() {
  return (
    <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="font-semibold tracking-tight text-stone-900 dark:text-white">
            Wrenchtron
          </Link>
          <span className="text-sm text-stone-500 dark:text-stone-400">Fleet demo</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={CONTACT_HREF} className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline dark:text-white">
            Get in touch
          </a>
          <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white" />
        </div>
      </div>
    </header>
  );
}

function RecentWork({
  summaries,
  now,
  onOpen,
  onSelect,
}: {
  summaries: VanSummary[];
  now: Date;
  onOpen: (s: LightboxState) => void;
  onSelect: (id: string) => void;
}) {
  const recent = summaries
    .flatMap((s) => s.visits.map((visit) => ({ visit, van: s.van })))
    .sort((a, b) => b.visit.date.getTime() - a.visit.date.getTime())
    .slice(0, 8);

  return (
    <section>
      <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Recent work</h2>
      <p className="text-sm text-stone-500 dark:text-stone-400">Photos come in with every job, from every site.</p>
      <ol className="mt-4 divide-y divide-stone-200 dark:divide-stone-800">
        {recent.map(({ visit, van }) => (
          <li key={`${van.id}-${visit.id}`} className="py-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <button
                onClick={() => onSelect(van.id)}
                className="text-left font-medium text-stone-900 underline-offset-4 hover:underline dark:text-white"
              >
                {van.unit}
              </button>
              <span className="shrink-0 tabular-nums text-stone-400">{ago(visit.date, now)}</span>
            </div>
            <p className="mb-2 text-sm text-stone-600 dark:text-stone-400">
              {visitTitle(visit)} · {visit.tech}, {visit.location}
            </p>
            <Thumbs visit={visit} unit={van.unit} onOpen={onOpen} />
          </li>
        ))}
      </ol>
    </section>
  );
}

type SortKey = "unit" | "due";

type Focus = "off_road" | "overdue" | "due_soon";

const FOCUS_FILTERS: Record<Focus, (s: VanSummary) => boolean> = {
  off_road: (s) => s.van.status !== "in_service",
  overdue: (s) => s.next?.status === "overdue",
  due_soon: (s) => s.next?.status === "due_soon",
};

const STATUS_RANK: Record<VanStatus, number> = { down: 0, at_shop: 1, in_service: 2 };

function FleetTable({
  summaries,
  sort,
  onSort,
  onSelect,
  now,
}: {
  summaries: VanSummary[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onSelect: (id: string) => void;
  now: Date;
}) {
  if (summaries.length === 0) {
    return <p className="py-10 text-center text-sm text-stone-500">No vans match.</p>;
  }

  const sortButton = (key: SortKey, label: string) => (
    <button
      onClick={() => onSort(key)}
      className={`font-medium hover:text-stone-900 dark:hover:text-white ${sort === key ? "text-stone-900 dark:text-white" : ""}`}
    >
      {label}
      {sort === key && " ↓"}
    </button>
  );

  return (
    <>
      {/* Desktop table */}
      <table className="hidden w-full whitespace-nowrap text-sm md:table">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
            <th className="py-2 pr-4 font-medium">{sortButton("unit", "Unit")}</th>
            <th className="py-2 pr-4 font-medium">Vehicle</th>
            <th className="py-2 pr-4 font-medium">Site</th>
            <th className="py-2 pr-4 text-right font-medium">Odometer</th>
            <th className="py-2 pr-4 font-medium">{sortButton("due", "Next due")}</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 text-right font-medium">Last service</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => {
            const { van } = s;
            const status = VAN_STATUS[van.status];
            return (
              <tr
                key={van.id}
                onClick={() => onSelect(van.id)}
                className="cursor-pointer border-b border-stone-100 hover:bg-stone-100/70 dark:border-stone-900 dark:hover:bg-stone-900"
              >
                <td className="py-2.5 pr-4 font-medium tabular-nums text-stone-900 dark:text-white">
                  <button onClick={() => onSelect(van.id)} className="hover:underline">
                    {van.unit}
                  </button>
                </td>
                <td className="py-2.5 pr-4 text-stone-600 dark:text-stone-400">
                  {van.make} {van.model}
                </td>
                <td className="py-2.5 pr-4 text-stone-600 dark:text-stone-400">{van.location}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-stone-600 dark:text-stone-400">
                  {van.currentMileage.toLocaleString()}
                </td>
                <td className="py-2.5 pr-4">
                  <DueCell summary={s} />
                </td>
                <td className={`py-2.5 pr-4 ${status.className}`} title={van.statusNote}>
                  {status.label}
                </td>
                <td className="py-2.5 text-right tabular-nums text-stone-500 dark:text-stone-400">
                  {van.logs[0] ? ago(van.logs[0].date, now) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile list */}
      <ul className="divide-y divide-stone-200 dark:divide-stone-800 md:hidden">
        {summaries.map((s) => {
          const { van } = s;
          const status = VAN_STATUS[van.status];
          return (
            <li key={van.id}>
              <button onClick={() => onSelect(van.id)} className="w-full py-3 text-left text-sm">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-stone-900 dark:text-white">{van.unit}</span>
                  <span className={status.className}>{status.label}</span>
                </span>
                <span className="mt-0.5 block text-stone-500 dark:text-stone-400">
                  {van.model} · {van.location} · {van.currentMileage.toLocaleString()} mi
                </span>
                <span className="mt-1 block">
                  <DueCell summary={s} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
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
  const [focus, setFocus] = useState<Focus | null>(null);
  const [sort, setSort] = useState<SortKey>("due");

  const scoped = location ? summaries.filter((s) => s.van.location === location) : summaries;
  const needsAttention = (s: VanSummary) =>
    s.van.status !== "in_service" || s.next?.status === "overdue" || s.next?.status === "due_soon";
  const q = query.trim().toLowerCase();
  const visible = scoped
    .filter((s) => !attentionOnly || needsAttention(s))
    .filter((s) => !focus || FOCUS_FILTERS[focus](s))
    .filter((s) => !q || `${s.van.unit} ${s.van.plate} ${s.van.make} ${s.van.model}`.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === "due"
        ? // Vans that can't run come first, then whatever is due soonest
          STATUS_RANK[a.van.status] - STATUS_RANK[b.van.status] || a.urgency - b.urgency
        : a.van.unit.localeCompare(b.van.unit, undefined, { numeric: true })
    );

  const thirtyDaysAgo = now.getTime() - 30 * DAY_MS;
  const photos30 = scoped.reduce(
    (n, s) => n + s.visits.filter((v) => v.date.getTime() >= thirtyDaysAgo).reduce((m, v) => m + v.photos.length, 0),
    0
  );
  const attentionCount = scoped.filter(needsAttention).length;
  const count = (f: Focus) => scoped.filter(FOCUS_FILTERS[f]).length;

  const stats: Array<{ value: number; label: string; focus?: Focus }> = [
    { value: scoped.length, label: "vans" },
    { value: count("off_road"), label: "off the road", focus: "off_road" },
    { value: count("overdue"), label: "overdue", focus: "overdue" },
    { value: count("due_soon"), label: "due soon", focus: "due_soon" },
    { value: photos30, label: "photos, last 30 days" },
  ];

  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="text-sm text-stone-500 dark:text-stone-400">Demo Delivery Co. — sample data</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-3xl">
          Know what was done to every van, and see the proof.
        </h1>
        <p className="mt-3 text-stone-600 dark:text-stone-300">
          Whoever does the work snaps the odometer, the part, and the invoice. You see it from Bozeman, whether the van
          was serviced in the yard, at a partner shop in Billings, or by a mobile tech in Helena.
        </p>
      </div>

      <dl className="mb-8 flex flex-wrap gap-x-8 gap-y-3 border-y border-stone-200 py-4 dark:border-stone-800">
        {stats.map(({ value, label, focus: key }) => {
          const content = (
            <>
              <dt className="sr-only">{label}</dt>
              <dd className="text-xl font-semibold tabular-nums text-stone-900 dark:text-white">{value}</dd>
              <span aria-hidden className="text-sm text-stone-500 dark:text-stone-400">{label}</span>
            </>
          );
          if (!key) {
            return (
              <div key={label} className="flex items-baseline gap-1.5">
                {content}
              </div>
            );
          }
          const active = focus === key;
          return (
            <button
              key={label}
              onClick={() => setFocus(active ? null : key)}
              aria-pressed={active}
              title={active ? "Show all vans" : `Show only vans ${label}`}
              className={`flex items-baseline gap-1.5 border-b-2 pb-0.5 ${active
                ? "border-stone-900 dark:border-white"
                : "border-transparent hover:border-stone-300 dark:hover:border-stone-600"
                }`}
            >
              {content}
            </button>
          );
        })}
      </dl>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <nav className="flex gap-4 text-sm" aria-label="Site">
              {[null, ...FLEET_LOCATIONS].map((loc) => {
                const active = location === loc;
                const count = loc ? summaries.filter((s) => s.van.location === loc).length : summaries.length;
                return (
                  <button
                    key={loc ?? "all"}
                    onClick={() => onLocation(loc)}
                    className={`border-b-2 pb-1 ${active
                      ? "border-stone-900 font-medium text-stone-900 dark:border-white dark:text-white"
                      : "border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                      }`}
                  >
                    {loc ?? "All sites"} <span className="tabular-nums text-stone-400">{count}</span>
                  </button>
                );
              })}
            </nav>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={attentionOnly}
                  onChange={(e) => setAttentionOnly(e.target.checked)}
                  className="h-3.5 w-3.5 accent-stone-900 dark:accent-white"
                />
                Needs attention ({attentionCount})
              </label>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Unit, plate, model"
                aria-label="Search vans"
                className="w-full min-w-0 rounded border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-stone-300 sm:w-44"
              />
            </div>
          </div>
          <FleetTable summaries={visible} sort={sort} onSort={setSort} onSelect={onSelect} now={now} />
        </section>

        <aside className="min-w-0">
          <RecentWork summaries={visible} now={now} onOpen={onOpen} onSelect={onSelect} />
        </aside>
      </div>

      <div className="mt-16 border-t border-stone-200 pt-8 dark:border-stone-800">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Want this for your fleet?</h2>
        <p className="mt-1 max-w-xl text-stone-600 dark:text-stone-300">
          Send a list of VINs and I&apos;ll load your vans with the right service schedule. Your team starts logging
          with photos from their phones on day one.
        </p>
        <a
          href={CONTACT_HREF}
          className="mt-4 inline-block rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
        >
          Get in touch
        </a>
      </div>
    </>
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
  const { van, items, visits } = summary;
  const daily = van.estimatedAnnualMileage / 365;
  const totalCost = visits.reduce((n, v) => n + v.cost, 0);
  const status = VAN_STATUS[van.status];

  return (
    <div>
      <button onClick={onBack} className="mb-6 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">
        ← All vans
      </button>

      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 dark:border-stone-800 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">{van.unit}</h1>
          <p className="mt-1 text-stone-600 dark:text-stone-400">
            {van.year} {van.make} {van.model} · {van.plate} · {van.location}
          </p>
          {van.status !== "in_service" && (
            <p className={`mt-1 text-sm ${status.className}`}>
              {status.label}
              {van.statusNote && ` — ${van.statusNote}`}
            </p>
          )}
        </div>
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="text-stone-500 dark:text-stone-400">Odometer</dt>
            <dd className="text-lg font-semibold tabular-nums text-stone-900 dark:text-white">{van.currentMileage.toLocaleString()} mi</dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-stone-400">
              Spent since {van.addedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </dt>
            <dd className="text-lg font-semibold tabular-nums text-stone-900 dark:text-white">{formatCost(totalCost)}</dd>
          </div>
        </dl>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Coming up</h2>
        <ul className="mt-2 max-w-xl">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 border-b border-stone-100 py-2 text-sm dark:border-stone-900">
              <span className="inline-flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <span className={`h-2 w-2 rounded-full ${DOT[item.status]}`} />
                {sentenceCase(item.serviceName)}
              </span>
              <span className={item.status === "overdue" ? "text-red-600 dark:text-red-400" : "text-stone-500 dark:text-stone-400"}>
                {dueLabel(item, daily)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-white">History</h2>
        <ol className="mt-2">
          {visits.map((visit) => (
            <li
              key={visit.id}
              className="grid gap-x-6 gap-y-2 border-b border-stone-200 py-5 dark:border-stone-800 sm:grid-cols-[8rem_minmax(0,1fr)]"
            >
              <div className="text-sm">
                <p className="font-medium text-stone-900 dark:text-white">{shortDate(visit.date, true)}</p>
                <p className="tabular-nums text-stone-500 dark:text-stone-400">{visit.mileage.toLocaleString()} mi</p>
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium text-stone-900 dark:text-white">{visitTitle(visit)}</p>
                  <p className="shrink-0 tabular-nums text-stone-900 dark:text-white">{formatCost(visit.cost)}</p>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {visit.shop} · logged by {visit.tech}
                </p>
                {visit.notes.map((note) => (
                  <p key={note} className="mt-1 text-sm text-stone-700 dark:text-stone-300">
                    {note}
                  </p>
                ))}
                <div className="mt-3">
                  <Thumbs visit={visit} unit={van.unit} onOpen={onOpen} size="md" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
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
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <FleetHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
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
      </main>
      {lightbox && <Lightbox state={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
