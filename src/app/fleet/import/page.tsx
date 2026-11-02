"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFleet } from "@/components/fleet/FleetProvider";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { addSites, importFleetVans, type NewFleetVan } from "@/lib/firebase/fleet";
import { decodeVins, type BatchDecodeResult } from "@/lib/nhtsa/decodeVin";
import { scheduleFor } from "@/data/fleetSchedules";
import { importable, parseVanList, type ImportRow } from "@/utils/fleetImport";

const EXAMPLE = `Unit\tVIN\tPlate\tSite\tOdometer
117\t1FTBR1C8XPKA12345\tMT 4-1234A\tBozeman\t42,118
118\t3C6LRVDG2PE512346\tMT 4-1235A\tBozeman\t38,902`;

const inputClass =
  "w-full rounded border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-stone-300 sm:text-sm";
const buttonClass =
  "rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200";

/** Skipped lines, then lines with warnings, then the rest. */
function rank(row: ImportRow): number {
  if (!importable(row)) return 0;
  return row.issues.length ? 1 : 2;
}

interface Review {
  rows: ImportRow[];
  decoded: Map<string, BatchDecodeResult>;
}

export default function ImportVansPage() {
  const { fleetId, fleet, member, vehicles, loading } = useFleet();
  const { showToast } = useToast();
  const router = useRouter();

  const [text, setText] = useState("");
  const [defaultSite, setDefaultSite] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const sites = useMemo(() => fleet?.sites ?? [], [fleet]);
  const siteFallback = defaultSite ?? sites[0]?.name ?? "";

  if (loading || vehicles === null) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }
  if (!fleetId || !fleet || !member || member.role === "tech") {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">Managers add vans</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-300">Ask the fleet&apos;s owner or a manager to import them.</p>
      </div>
    );
  }

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
    setReview(null);
  };

  const check = async () => {
    const rows = parseVanList(text, vehicles.map((v) => v.vin ?? ""));
    if (!rows.length) return;
    setChecking(true);
    const decoded = await decodeVins(rows.filter(importable).map((r) => r.vin));
    setReview({ rows, decoded });
    setChecking(false);
  };

  const ready = review?.rows.filter(importable) ?? [];
  const skipped = (review?.rows.length ?? 0) - ready.length;
  const siteName = (row: ImportRow) => row.site?.trim() || siteFallback.trim();
  const knownSite = (name: string) => sites.find((s) => s.name.toLowerCase() === name.toLowerCase());
  const newSites = [...new Set(ready.map(siteName).filter((n) => n && !knownSite(n)))];
  const missingSite = ready.some((r) => !siteName(r));
  const scheduleCounts = ready.reduce<Record<string, number>>((counts, r) => {
    const name = scheduleFor(review?.decoded.get(r.vin)?.electric ? "electric" : "gas").name;
    counts[name] = (counts[name] ?? 0) + 1;
    return counts;
  }, {});

  const save = async () => {
    if (!review || !ready.length || missingSite) return;
    setSaving(true);
    try {
      const allSites = await addSites(fleetId, sites, newSites);
      const siteIdFor = (name: string) => allSites.find((s) => s.name.toLowerCase() === name.toLowerCase())!.id;
      const vans: NewFleetVan[] = ready.map((row) => {
        const d = review.decoded.get(row.vin);
        const powertrain = d?.electric ? "electric" : "gas";
        const schedule = scheduleFor(powertrain);
        return {
          unit: row.unit,
          vin: row.vin,
          licensePlate: row.plate,
          siteId: siteIdFor(siteName(row)),
          currentMileage: row.odometer ?? 0,
          year: d?.year,
          make: d?.make,
          model: d?.model,
          trim: d?.trim,
          engine: d?.engine,
          powertrain,
          scheduleId: schedule.id,
          serviceIntervals: schedule.intervals,
        };
      });
      await importFleetVans(fleetId, vans);
      showToast(`Added ${vans.length} ${vans.length === 1 ? "van" : "vans"}.`, "success");
      router.push("/fleet");
    } catch (error) {
      console.error("Van import failed:", error);
      showToast("The import didn't finish. Vans already added are on the board; check before trying again.", "error");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-3xl">Add vans</h1>
      <p className="mt-1 text-stone-600 dark:text-stone-300">
        Paste from a spreadsheet, one van per line. Only the VIN is required. Year, make and model come from the VIN.
      </p>

      {!review ? (
        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-1 flex items-baseline justify-between gap-4 text-sm font-medium text-stone-700 dark:text-stone-300">
              Vans
              <span className="font-normal text-stone-500 dark:text-stone-400">
                or{" "}
                <label className="cursor-pointer underline underline-offset-4">
                  upload a CSV
                  <input type="file" accept=".csv,.tsv,.txt,text/csv" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
                </label>
              </span>
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              spellCheck={false}
              wrap="off"
              placeholder={EXAMPLE}
              className={`${inputClass} font-mono !text-sm`}
            />
          </label>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Columns: VIN, unit, plate, site, odometer. With a header row like the example they can be in any order.
          </p>

          <label className="block max-w-xs">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">Site for lines without one</span>
            <input
              list="fleet-sites"
              value={siteFallback}
              onChange={(e) => setDefaultSite(e.target.value)}
              placeholder="Bozeman"
              className={inputClass}
            />
            <datalist id="fleet-sites">
              {sites.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </label>

          <div className="flex items-center gap-4">
            <button onClick={check} disabled={checking || !text.trim()} className={buttonClass}>
              {checking ? "Looking up VINs…" : "Review"}
            </button>
            <Link href="/fleet" className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-300">
              Cancel
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-y border-stone-200 py-3 text-sm dark:border-stone-800">
            <span className="font-medium text-stone-900 dark:text-white">
              {ready.length} {ready.length === 1 ? "van" : "vans"} ready
            </span>
            {skipped > 0 && <span className="text-red-700 dark:text-red-400">{skipped} skipped</span>}
            {Object.entries(scheduleCounts).map(([name, n]) => (
              <span key={name} className="text-stone-500 dark:text-stone-400">
                {n} on {name.toLowerCase()}
              </span>
            ))}
            {newSites.length > 0 && (
              <span className="text-stone-500 dark:text-stone-400">New {newSites.length === 1 ? "site" : "sites"}: {newSites.join(", ")}</span>
            )}
          </div>
          {missingSite && (
            <p className="mt-3 text-sm text-red-700 dark:text-red-400">
              Some lines have no site. Go back and fill in &ldquo;Site for lines without one.&rdquo;
            </p>
          )}

          <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
            {/* Problems first, so nobody scrolls past 80 good vans to find the two that need fixing */}
            {review.rows
              .slice()
              .sort((a, b) => rank(a) - rank(b) || a.line - b.line)
              .map((row) => {
              const d = review.decoded.get(row.vin);
              const ok = importable(row);
              const vehicle = d ? [d.year, d.make, d.model].filter(Boolean).join(" ") : null;
              return (
                <li key={row.line} className={`py-3 ${ok ? "" : "opacity-70"}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-medium text-stone-900 dark:text-white">
                      {row.unit || "—"}
                      <span className="ml-2 font-normal text-stone-600 dark:text-stone-300">
                        {vehicle ?? (ok ? "Not found by NHTSA" : "")}
                      </span>
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {[siteName(row), row.odometer !== undefined ? `${row.odometer.toLocaleString()} mi` : "no odometer", row.plate]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-stone-500 dark:text-stone-400">
                    Line {row.line} · {row.vin || "—"}
                  </p>
                  {row.issues.map((issue) => (
                    <p
                      key={issue.message}
                      className={`mt-1 text-sm ${issue.level === "error" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}
                    >
                      {issue.level === "error" ? "Skipped: " : ""}
                      {issue.message}
                    </p>
                  ))}
                </li>
              );
            })}
          </ul>

          <div className="sticky bottom-0 -mx-4 mt-4 flex items-center gap-4 border-t border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:mx-0 sm:px-0">
            <button onClick={save} disabled={saving || !ready.length || missingSite} className={buttonClass}>
              {saving ? "Adding…" : `Add ${ready.length} ${ready.length === 1 ? "van" : "vans"}`}
            </button>
            <button
              onClick={() => setReview(null)}
              disabled={saving}
              className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-300"
            >
              Back to edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
