"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { setVanStatus } from "@/lib/firebase/fleet";
import type { VanStatus } from "@/types/fleet";

const OPTIONS: { status: VanStatus; label: string }[] = [
  { status: "down", label: "Mark down" },
  { status: "at_shop", label: "At the shop" },
  { status: "in_service", label: "Back in service" },
];

const NOTE_PLACEHOLDER: Partial<Record<VanStatus, string>> = {
  down: "Why? e.g. Rear bumper damage — waiting on part",
  at_shop: "Where, and for what? e.g. Brakes at Gallatin Tire",
};

/** Lets any member take a van off the road or put it back, with a reason the board shows. */
export function VanStatusControl({
  fleetId,
  vehicleId,
  status,
  statusNote,
}: {
  fleetId: string;
  vehicleId: string;
  status: VanStatus;
  statusNote?: string;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<VanStatus | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const apply = async (next: VanStatus, nextNote?: string) => {
    setSaving(true);
    try {
      const sent = await setVanStatus(fleetId, vehicleId, next, nextNote);
      if (!sent) showToast("Saved on this phone. Everyone else sees it once you have signal.", "info");
      setEditing(null);
    } catch (error) {
      console.error("Failed to change van status:", error);
      showToast("Couldn't change the status. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const choose = (next: VanStatus) => {
    if (next === "in_service") {
      void apply(next);
      return;
    }
    setNote(next === status ? (statusNote ?? "") : "");
    setEditing(next);
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          // A running van has nothing to go back to
          if (o.status === "in_service" && status === "in_service") return null;
          const current = o.status === status;
          return (
            <button
              key={o.status}
              type="button"
              disabled={saving}
              onClick={() => choose(o.status)}
              className={`rounded-full border px-3 py-1 text-sm disabled:opacity-50 ${current || editing === o.status
                ? "border-stone-900 text-stone-900 dark:border-white dark:text-white"
                : "border-stone-300 text-stone-600 hover:border-stone-500 dark:border-stone-700 dark:text-stone-300"
                }`}
            >
              {current && o.status !== "in_service" ? `${o.label} · edit reason` : o.label}
            </button>
          );
        })}
      </div>
      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void apply(editing, note);
          }}
          className="mt-3 flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <input
            autoFocus
            value={note}
            maxLength={120}
            onChange={(e) => setNote(e.target.value)}
            placeholder={NOTE_PLACEHOLDER[editing]}
            aria-label="Reason"
            className="min-w-0 flex-1 rounded border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white sm:text-sm"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-white dark:text-stone-900"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm text-stone-600 dark:text-stone-300">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
