"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { fetchFleetHistory } from "@/lib/firebase/fleet";
import { downloadText, historyCsv, localDate, vansCsv } from "@/utils/fleetExport";
import type { Fleet, FleetVehicle } from "@/types/fleet";

/** Download the fleet as CSV: the vans, and every job logged on them. */
export function FleetExport({ fleetId, fleet, vehicles }: { fleetId: string; fleet: Fleet; vehicles: FleetVehicle[] }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const stamp = localDate(new Date());
  const slug = fleet.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "fleet";

  const exportHistory = async () => {
    setBusy(true);
    try {
      const entries = await fetchFleetHistory(fleetId, vehicles);
      downloadText(`${slug}-service-history-${stamp}.csv`, historyCsv(entries, fleet.sites));
    } catch (error) {
      console.error("History export failed:", error);
      showToast("Couldn't export the history. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const linkClass =
    "text-sm text-stone-600 underline underline-offset-4 hover:text-stone-900 disabled:opacity-50 dark:text-stone-300 dark:hover:text-white";

  return (
    <div className="mt-16 border-t border-stone-200 pt-6 dark:border-stone-800">
      <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Your data</h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Spreadsheets you can open in Excel or Google Sheets. The history links to every photo.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <button onClick={() => downloadText(`${slug}-vans-${stamp}.csv`, vansCsv(vehicles, fleet.sites))} className={linkClass}>
          Download vans (CSV)
        </button>
        <button onClick={exportHistory} disabled={busy} className={linkClass}>
          {busy ? "Gathering history…" : "Download service history (CSV)"}
        </button>
      </div>
    </div>
  );
}
