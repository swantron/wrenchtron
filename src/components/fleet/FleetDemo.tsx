"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
import { track } from "@/lib/demoBeacon";
import { generateFleet, FLEET_LOCATIONS, type FleetLocation, type FleetVan } from "@/data/fleetDemoData";

const CONTACT_HREF = "mailto:joe@swantron.com?subject=Wrenchtron%20for%20our%20fleet";

function FleetHeader({ onLog }: { onLog: () => void }) {
  return (
    <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          {/* Stays in the demo: the home page is the household product */}
          <Link href="/demo/fleet" className="font-semibold tracking-tight text-stone-900 dark:text-white">
            Wrenchtron
          </Link>
          <span className="text-sm text-stone-500 dark:text-stone-400">Fleet demo</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLog} className={`hidden md:block ${LOG_BUTTON}`}>
            Log a job
          </button>
          <a href={CONTACT_HREF} onClick={() => track("contact")} className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline dark:text-white">
            Get in touch
          </a>
          <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white" />
        </div>
      </div>
    </header>
  );
}

const DEMO_INTRO = (
  <div className="mb-5 max-w-2xl sm:mb-8">
    <p className="text-sm text-stone-500 dark:text-stone-400">Demo Delivery Co. — sample vans, drawn photos</p>
    <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-3xl">
      Know what was done to every van, and see the proof.
    </h1>
    <p className="mt-3 hidden text-stone-600 dark:text-stone-300 sm:block">
      Whoever does the work snaps the odometer, the part, and the invoice. You see it from Bozeman, whether the van
      was serviced in the yard, at a partner shop in Billings, or by a mobile tech in Helena.
    </p>
  </div>
);

const DEMO_FOOTER = (
  <div className="mt-16 border-t border-stone-200 pt-8 dark:border-stone-800">
    <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Want this for your fleet?</h2>
    <p className="mt-1 max-w-xl text-stone-600 dark:text-stone-300">
      Send a list of VINs and I&apos;ll load your vans with the right service schedule. Your team starts logging
      with photos from their phones on day one.
    </p>
    <a
      href={CONTACT_HREF}
      onClick={() => track("contact")}
      className="mt-4 inline-block rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
    >
      Get in touch
    </a>
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
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10 md:pb-10">
        {!isClient ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner />
          </div>
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
      {isClient && !sheet && (
        <button
          onClick={() => openSheet(selected?.van.id)}
          className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-stone-900 md:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5A1.5 1.5 0 014.5 7h2.3l1.4-2h7.6l1.4 2h2.3A1.5 1.5 0 0121 8.5v10a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5v-10z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Log a job
        </button>
      )}
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
