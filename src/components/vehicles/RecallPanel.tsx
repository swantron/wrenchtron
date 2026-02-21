"use client";

import { useState } from "react";
import Link from "next/link";
import { useRecalls, type NHTSARecall } from "@/hooks/useRecalls";
import { updateVehicle } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import type { Vehicle } from "@/types/firestore";

interface RecallPanelProps {
  vehicle: Vehicle;
}

export function RecallPanel({ vehicle }: RecallPanelProps) {
  const { user } = useAuth();
  const { recalls, loading, error } = useRecalls(vehicle.vin);

  // null = use vehicle prop; non-null = optimistic override after user action
  const [optimisticResolved, setOptimisticResolved] = useState<string[] | null>(null);
  const resolved = optimisticResolved ?? vehicle.resolvedRecalls ?? [];

  const pending = recalls.filter(r => !resolved.includes(r.NHTSACampaignNumber));
  const done = recalls.filter(r => resolved.includes(r.NHTSACampaignNumber));

  const handleResolve = async (campaignNumber: string) => {
    if (!user || !vehicle.id) return;
    const updated = [...resolved, campaignNumber];
    setOptimisticResolved(updated);
    await updateVehicle(user.uid, vehicle.id, { resolvedRecalls: updated });
  };

  const handleUnresolve = async (campaignNumber: string) => {
    if (!user || !vehicle.id) return;
    const updated = resolved.filter(n => n !== campaignNumber);
    setOptimisticResolved(updated);
    await updateVehicle(user.uid, vehicle.id, { resolvedRecalls: updated });
  };

  if (!vehicle.vin) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-5 dark:border-gray-700">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Recalls
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Add a VIN to check for open NHTSA recalls.
        </p>
        <Link
          href={`/vehicles/edit?id=${vehicle.id}`}
          className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
        >
          Add VIN →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Recalls
        </h3>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {pending.length} pending
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Checking NHTSA records…</p>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {!loading && !error && recalls.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">No open recalls on file.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map(recall => (
            <RecallRow
              key={recall.NHTSACampaignNumber}
              recall={recall}
              resolved={false}
              onResolve={user ? () => handleResolve(recall.NHTSACampaignNumber) : undefined}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className={`space-y-3 ${pending.length > 0 ? "mt-4 border-t border-gray-100 pt-4 dark:border-gray-700" : ""}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Resolved</p>
          {done.map(recall => (
            <RecallRow
              key={recall.NHTSACampaignNumber}
              recall={recall}
              resolved={true}
              onUnresolve={user ? () => handleUnresolve(recall.NHTSACampaignNumber) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecallRow({
  recall,
  resolved,
  onResolve,
  onUnresolve,
}: {
  recall: NHTSARecall;
  resolved: boolean;
  onResolve?: () => void;
  onUnresolve?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border p-3 ${resolved ? "border-gray-100 bg-gray-50/50 dark:border-gray-700/50 dark:bg-gray-900/20" : "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-900/10"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${resolved ? "text-gray-400" : "text-amber-700 dark:text-amber-400"}`}>
              {recall.NHTSACampaignNumber}
            </span>
            {resolved && (
              <span className="text-xs text-gray-400">✓ Resolved</span>
            )}
          </div>
          <p className={`mt-0.5 text-sm font-medium ${resolved ? "text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
            {recall.Component}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {expanded ? "Less" : "Details"}
          </button>
          {!resolved && onResolve && (
            <button
              onClick={onResolve}
              className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-green-700"
            >
              Mark Fixed
            </button>
          )}
          {resolved && onUnresolve && (
            <button
              onClick={onUnresolve}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Undo
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
          {recall.Summary && <p><span className="font-semibold">Summary:</span> {recall.Summary}</p>}
          {recall.Consequence && <p><span className="font-semibold">Consequence:</span> {recall.Consequence}</p>}
          {recall.Remedy && <p><span className="font-semibold">Remedy:</span> {recall.Remedy}</p>}
        </div>
      )}
    </div>
  );
}
