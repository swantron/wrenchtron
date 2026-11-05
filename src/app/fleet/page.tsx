"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFleet } from "@/components/fleet/FleetProvider";
import {
  FleetOverview,
  LOG_BUTTON,
  showBoardView,
  Lightbox,
  summarize,
  VanDetail,
  type LightboxState,
  type Visit,
} from "@/components/fleet/FleetBoard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { LogVisitSheet } from "@/components/fleet/LogVisitSheet";
import { VanStatusControl } from "@/components/fleet/VanStatusControl";
import { VanEditor } from "@/components/fleet/VanEditor";
import { FleetExport } from "@/components/fleet/FleetExport";
import { toBoardVan } from "@/components/fleet/boardData";
import { deleteLogs, forgetFleet, subscribeToVanLogs } from "@/lib/firebase/fleet";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Fleet, FleetLog, FleetMember, FleetVehicle } from "@/types/fleet";
import type { User } from "firebase/auth";

const PLAN_LABELS = { pilot: "Pilot", active: "Active", lapsed: "Lapsed" } as const;

function FleetHome() {
  const { user } = useAuth();
  const { fleetId, fleet, member, memberships, noAccess, vehicles, loading } = useFleet();

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">You&apos;re not in a fleet yet</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-300">
          If someone invited you, open the link they sent and sign in with the same email. Otherwise, set up a fleet
          for your company.
        </p>
        <Link
          href="/fleet/new"
          className="mt-6 inline-block rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
        >
          Set up a fleet
        </Link>
      </div>
    );
  }

  if (noAccess || !fleet || !member) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">No access to this fleet</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-300">
          You may have been removed from it. Ask the fleet&apos;s owner to invite you again.
        </p>
        {user && fleetId && (
          <button
            onClick={() => forgetFleet(user.uid, fleetId).catch((error) => console.error("Failed to forget fleet:", error))}
            className="mt-6 rounded border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:text-stone-300"
          >
            Remove it from my list
          </button>
        )}
      </div>
    );
  }

  if (vehicles === null) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  const canManage = member.role !== "tech";
  const heading = (
    <>
      {fleet.plan && (
        <p className="mb-1 text-sm text-stone-500 dark:text-stone-400">{PLAN_LABELS[fleet.plan.status]} plan</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-3xl">{fleet.name}</h1>
        {canManage && (
          <Link
            href="/fleet/import"
            className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:text-stone-300"
          >
            Add vans
          </Link>
        )}
      </div>
    </>
  );

  if (vehicles.length === 0) {
    return (
      <div>
        {heading}
        <div className="mt-10 max-w-lg">
          <h2 className="font-semibold text-stone-900 dark:text-white">No vans yet</h2>
          <p className="mt-1 text-stone-600 dark:text-stone-300">
            {canManage ? (
              <>
                <Link href="/fleet/import" className="underline underline-offset-4">
                  Paste your VIN list
                </Link>{" "}
                and every van lands on the severe-duty schedule. Then{" "}
                <Link href="/fleet/team" className="underline underline-offset-4">
                  invite your techs
                </Link>
                .
              </>
            ) : (
              "A manager hasn't added the fleet's vans yet."
            )}
          </p>
        </div>
      </div>
    );
  }

  return <Board fleetId={fleetId!} fleet={fleet} member={member} user={user!} vehicles={vehicles} heading={heading} />;
}

function Board({
  fleetId,
  fleet,
  member,
  user,
  vehicles,
  heading,
}: {
  fleetId: string;
  fleet: Fleet;
  member: FleetMember;
  user: User;
  vehicles: FleetVehicle[];
  heading: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const [sheet, setSheet] = useState<{ vanId?: string } | null>(null);
  // Where to go once the sheet's history entry is gone
  const afterSheet = useRef<string | null>(null);
  const { showToast } = useToast();
  const [doomed, setDoomed] = useState<Visit | null>(null);
  const isManager = member.role !== "tech";

  const selectedId = searchParams.get("van");
  const siteNames = fleet.sites.map((s) => s.name);
  const location = siteNames.find((n) => n === searchParams.get("site")) ?? null;

  const { now, summaries } = useMemo(() => {
    const now = new Date();
    return { now, summaries: vehicles.map((v) => summarize(toBoardVan(v, fleet.sites), now)) };
  }, [vehicles, fleet.sites]);

  // Full history only for the van that's open (the board itself reads no logs)
  const [logs, setLogs] = useState<{ vanId: string; list: FleetLog[] } | null>(null);
  useEffect(() => {
    if (!selectedId) return;
    return subscribeToVanLogs(
      fleetId,
      selectedId,
      (list) => setLogs({ vanId: selectedId, list }),
      () => setLogs({ vanId: selectedId, list: [] })
    );
  }, [fleetId, selectedId]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedId);
  const vanLogs = logs?.vanId === selectedId ? logs.list : null;
  const selected = useMemo(
    // Until its history loads, the van shows what the board already knows (last visit, due dates)
    () => (selectedVehicle ? summarize(toBoardVan(selectedVehicle, fleet.sites, vanLogs ?? undefined), now) : undefined),
    [selectedVehicle, fleet.sites, vanLogs, now]
  );

  // Managers can delete anything; whoever logged a visit can take it back the same day
  const canDelete = (visit: Visit) => {
    if (isManager) return true;
    const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    return visit.logs.every((l) => {
      const raw = vanLogs?.find((r) => r.id === l.id);
      // A pending createdAt is a log from moments ago
      return raw?.loggedBy.uid === user.uid && (raw.createdAt?.toMillis?.() ?? now.getTime()) > dayAgo;
    });
  };

  const confirmDelete = async () => {
    const visit = doomed;
    setDoomed(null);
    if (!visit || !selectedVehicle || !vanLogs) return;
    try {
      const restored = await deleteLogs(fleetId, selectedVehicle, vanLogs, visit.logs.map((l) => l.id), isManager);
      showToast(
        restored === "in_service" ? "Deleted. Van is back in service." : restored ? "Deleted. Van status put back." : "Deleted.",
        "success"
      );
    } catch (error) {
      console.error("Failed to delete visit:", error);
      showToast("Couldn't delete it. Please try again.", "error");
    }
  };

  const navigate = (params: { van?: string | null; site?: string | null }) => {
    const next = new URLSearchParams();
    const site = params.site === undefined ? location : params.site;
    if (site) next.set("site", site);
    if (params.van) next.set("van", params.van);
    const qs = next.toString();
    showBoardView(`/fleet${qs ? `?${qs}` : ""}`, !!params.van);
  };

  const closeSheet = useCallback(() => {
    setSheet(null);
    const vanId = afterSheet.current;
    afterSheet.current = null;
    // Show the van the job was logged on, unless that's where we already are
    if (vanId && vanId !== selectedId) showBoardView(`/fleet?van=${vanId}`, true);
    else if (vanId) window.scrollTo({ top: 0 });
  }, [selectedId]);

  return (
    <div className="pb-20 md:pb-0">
      {selected && selectedVehicle && (
        <VanDetail
          summary={selected}
          onBack={() => navigate({ van: null })}
          onOpen={setLightbox}
          onLog={() => setSheet({ vanId: selectedVehicle.id })}
          historyLoading={vanLogs === null}
          visitAction={(visit) =>
            vanLogs && canDelete(visit) ? (
              <button
                onClick={() => setDoomed(visit)}
                className="text-stone-400 underline-offset-4 hover:text-red-600 hover:underline dark:hover:text-red-400"
              >
                Delete
              </button>
            ) : null
          }
          actions={
            <>
              <VanStatusControl
                fleetId={fleetId}
                vehicleId={selectedVehicle.id!}
                status={selectedVehicle.status ?? "in_service"}
                statusNote={selectedVehicle.statusNote}
              />
              {isManager && (
                <VanEditor
                  key={selectedVehicle.id}
                  fleetId={fleetId}
                  vehicle={selectedVehicle}
                  sites={fleet.sites}
                  onRemoved={() => navigate({ van: null })}
                />
              )}
            </>
          }
        />
      )}
      {selectedId && !selectedVehicle && (
        <p className="text-stone-600 dark:text-stone-300">
          That van isn&apos;t in this fleet any more.{" "}
          <button onClick={() => navigate({ van: null })} className="underline underline-offset-4">
            Back to the board
          </button>
        </p>
      )}
      {/* Stays mounted under a van page so search, filters and sort survive the trip */}
      <div hidden={!!selectedId}>
        <FleetOverview
          summaries={summaries}
          now={now}
          sites={siteNames}
          location={location}
          onLocation={(site) => navigate({ site })}
          onSelect={(van) => navigate({ van })}
          onOpen={setLightbox}
          intro={
            <div className="mb-5 sm:mb-8">
              {heading}
              <button onClick={() => setSheet({})} className={`mt-4 hidden md:inline-block ${LOG_BUTTON}`}>
                Log a job
              </button>
            </div>
          }
          footer={member.role !== "tech" ? <FleetExport fleetId={fleetId} fleet={fleet} vehicles={vehicles} /> : undefined}
          recentNote="The latest visit on each van, newest first."
          activity="serviced"
        />
      </div>

      {!sheet && (
        <button
          onClick={() => setSheet({ vanId: selectedVehicle?.id })}
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
        <LogVisitSheet
          fleetId={fleetId}
          user={user}
          userName={member.displayName}
          vehicles={vehicles}
          sites={fleet.sites}
          initialVanId={sheet.vanId}
          onSaved={(vanId) => {
            afterSheet.current = vanId;
          }}
          onClose={closeSheet}
        />
      )}
      {lightbox && <Lightbox state={lightbox} onClose={closeLightbox} />}
      <ConfirmDialog
        open={!!doomed}
        title="Delete this visit?"
        description={
          isManager
            ? "It comes out of the van's history, with its photos, and the due dates are worked out again from what's left."
            : "It comes out of the van's history and the due dates are worked out again. You can only do this the day you logged it."
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDoomed(null)}
      />
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense>
      <FleetHome />
    </Suspense>
  );
}
