"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DemoLogSheet, type DemoLogEntry } from "@/components/fleet/DemoLogSheet";
import {
  FleetOverview,
  LOG_BUTTON,
  showBoardView,
  Lightbox,
  summarize,
  useIsClient,
  VanDetail,
  type LightboxState,
} from "@/components/fleet/FleetBoard";
import { FleetPitch } from "@/components/fleet/FleetPitch";
import { track } from "@/lib/demoBeacon";
import { generateFleet, FLEET_LOCATIONS, type FleetLocation, type FleetVan } from "@/data/fleetDemoData";

const CONTACT_HREF = "mailto:joe@swantron.com?subject=Wrenchtron%20for%20our%20fleet";

function FleetHeader({ onLog }: { onLog: () => void }) {
  return (
    <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
        <div className="flex items-baseline gap-3">
          {/* Stays in the demo: the home page is the household product */}
          <Link href="/demo/fleet" className="font-semibold tracking-tight text-stone-900 dark:text-white">
            Wrenchtron
          </Link>
          <span className="hidden text-sm text-stone-500 sm:inline dark:text-stone-400">Fleet demo</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLog} className={LOG_BUTTON}>
            Log a job
          </button>
          <a href={CONTACT_HREF} onClick={() => track("contact")} className="inline-flex min-h-11 items-center text-sm font-medium text-stone-900 underline-offset-4 hover:underline dark:text-white">
            Get in touch
          </a>
          <ThemeToggle className="flex h-11 w-11 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white" />
        </div>
      </div>
    </header>
  );
}

const DEMO_INTRO = <FleetPitch />;

const DEMO_FOOTER = (
  <div className="mt-16 border-t border-stone-200 pt-8 dark:border-stone-800">
    <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Want this for your fleet?</h2>
    <p className="mt-1 max-w-xl text-stone-600 dark:text-stone-300">
      Paste your vans and the schedule comes from the VIN. Your team logs the work, with photos, from their phones.
    </p>
    <Link
      href="/login?next=/fleet/new"
      className="mt-4 inline-flex min-h-11 items-center rounded bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
    >
      Start a fleet
    </Link>
  </div>
);

export function FleetDemo() {
  const isClient = useIsClient();
  const searchParams = useSearchParams();
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const [sheet, setSheet] = useState<{ vanId?: string } | null>(null);
  const [entries, setEntries] = useState<DemoLogEntry[]>([]);
  // Where to go once the sheet's history entry is gone
  const afterSheet = useRef<string | null>(null);

  const { now, fleet } = useMemo(() => {
    const now = new Date();
    return { now, fleet: isClient ? generateFleet(now) : [] };
  }, [isClient]);

  // Jobs logged in this visit, on top of the sample fleet
  const vans = useMemo(
    () =>
      fleet.map((van) => {
        const mine = entries.filter((e) => e.vanId === van.id);
        if (!mine.length) return van;
        const merged = mine.reduce<FleetVan>(
          (v, e) => ({
            ...v,
            ...e.status,
            ...(e.status?.status === "in_service" && { statusNote: undefined }),
            currentMileage: Math.max(v.currentMileage, e.log.mileage),
          }),
          van
        );
        return { ...merged, logs: [...mine.map((e) => e.log).reverse(), ...van.logs] };
      }),
    [fleet, entries]
  );
  const summaries = useMemo(() => vans.map((van) => summarize(van, now)), [vans, now]);

  const selectedId = searchParams.get("van");
  const locParam = searchParams.get("loc");
  const location = FLEET_LOCATIONS.find((l) => l === locParam) ?? null;
  const selected = summaries.find((s) => s.van.id === selectedId);

  useEffect(() => {
    if (isClient) track("open", selectedId ?? undefined);
  }, [isClient]); // eslint-disable-line react-hooks/exhaustive-deps -- once per page load
  useEffect(() => {
    if (selectedId) track("van", selectedId);
  }, [selectedId]);

  const navigate = (params: { van?: string | null; loc?: FleetLocation | null }) => {
    const next = new URLSearchParams();
    const loc = params.loc === undefined ? location : params.loc;
    if (loc) next.set("loc", loc);
    if (params.van) next.set("van", params.van);
    const qs = next.toString();
    showBoardView(`/demo/fleet${qs ? `?${qs}` : ""}`, !!params.van);
  };

  const closeSheet = useCallback(() => {
    setSheet(null);
    const vanId = afterSheet.current;
    afterSheet.current = null;
    // Show the van the job was logged on, unless that's where we already are
    if (vanId && vanId !== selectedId) {
      showBoardView(`/demo/fleet?van=${vanId}`, true);
    } else if (vanId) {
      window.scrollTo({ top: 0 });
    }
  }, [selectedId]);

  const openSheet = (vanId?: string) => {
    track("log_open", vanId);
    setSheet({ vanId });
  };

  const saveEntry = (entry: DemoLogEntry) => {
    track("log_saved", `${entry.log.title ?? entry.log.maintenanceType}:${entry.log.photos.length}`);
    setEntries((current) => [...current, entry]);
    afterSheet.current = entry.vanId;
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <FleetHeader onLog={() => openSheet(selected?.van.id)} />
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10">
        {!isClient ? (
          <FleetPitch />
        ) : (
          <>
            {selected && (
              <VanDetail
                summary={selected}
                onBack={() => navigate({ van: null })}
                onOpen={setLightbox}
                onLog={() => openSheet(selected.van.id)}
              />
            )}
            {/* Stays mounted under a van page so search, filters and sort survive the trip */}
            <div hidden={!!selected}>
              <FleetOverview
                summaries={summaries}
                now={now}
                sites={FLEET_LOCATIONS}
                location={location}
                onLocation={(loc) => navigate({ loc: FLEET_LOCATIONS.find((l) => l === loc) ?? null })}
                onSelect={(van) => navigate({ van })}
                onOpen={setLightbox}
                intro={DEMO_INTRO}
                footer={DEMO_FOOTER}
                recentNote="Photos come in with every job, from every site. The ones in this demo are drawn stand-ins."
              />
            </div>
          </>
        )}
      </main>
      {sheet && (
        <DemoLogSheet
          vans={vans}
          initialVanId={sheet.vanId}
          onSave={saveEntry}
          onClose={closeSheet}
        />
      )}
      {lightbox && <Lightbox state={lightbox} onClose={closeLightbox} onView={(id) => track("photo", id)} />}
    </div>
  );
}
