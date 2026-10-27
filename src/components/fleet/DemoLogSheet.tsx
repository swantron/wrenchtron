"use client";

import { useEffect, useRef, useState } from "react";
import { useBackToClose } from "@/components/fleet/useBackToClose";
import { FLEET_LOCATIONS, type FleetLog, type FleetPhoto, type FleetVan, type VanStatus } from "@/data/fleetDemoData";
import type { MaintenanceType } from "@/types/maintenance";

// Logging a job in the demo: pick the van, snap photos, save. Nothing leaves the
// phone — photos stay as local object URLs and vanish on reload.

interface JobOption {
  key: string;
  label: string;
  type: MaintenanceType;
  /** Shown in history instead of the maintenance type. */
  title?: string;
}

const JOBS: JobOption[] = [
  { key: "oil", label: "Oil change", type: "oil_change" },
  { key: "rotation", label: "Tire rotation", type: "tire_rotation" },
  { key: "brakes", label: "Brakes", type: "brake_pads" },
  { key: "inspection", label: "Inspection", type: "inspection" },
  { key: "damage", label: "Damage / issue", type: "other", title: "Damage report" },
  { key: "other", label: "Other", type: "other" },
];

export interface DemoLogEntry {
  vanId: string;
  log: FleetLog;
  /** Set when the job changes whether the van can run. */
  status?: { status: VanStatus; statusNote?: string };
}

interface Draft {
  file: File;
  url: string;
}

const inputClass =
  "w-full rounded border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-stone-300";

export function DemoLogSheet({
  vans,
  initialVanId,
  onSave,
  onClose,
}: {
  vans: FleetVan[];
  initialVanId?: string;
  onSave: (entry: DemoLogEntry) => void;
  onClose: () => void;
}) {
  const close = useBackToClose("wrenchtronLogSheet", onClose);
  const fileInput = useRef<HTMLInputElement>(null);

  const [vanId, setVanId] = useState(initialVanId ?? "");
  const van = vans.find((v) => v.id === vanId);
  const [jobKey, setJobKey] = useState<string | null>(null);
  const job = JOBS.find((j) => j.key === jobKey);
  const [mileage, setMileage] = useState(van ? String(van.currentMileage) : "");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Draft[]>([]);
  const [offRoad, setOffRoad] = useState(true);
  const [backOnRoad, setBackOnRoad] = useState(true);

  // Keep the page behind from scrolling while the sheet is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const pickVan = (id: string) => {
    setVanId(id);
    const picked = vans.find((v) => v.id === id);
    setMileage(picked ? String(picked.currentMileage) : "");
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...added]);
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    setPhotos((current) => current.filter((p) => p.url !== url));
  };

  const isDamage = job?.key === "damage";
  const miles = Number(mileage.replace(/[^0-9]/g, ""));
  const canSave = !!van && !!job && miles > 0;

  const save = () => {
    if (!van || !job || !canSave) return;
    const id = `demo-${Date.now()}`;
    const log: FleetLog = {
      id,
      maintenanceType: job.type,
      title: job.title,
      date: new Date(),
      mileage: miles,
      cost: 0,
      shop: "Logged from a phone",
      tech: "You",
      location: van.location,
      notes: notes.trim() || undefined,
      details: {},
      photos: photos.map(
        (p, i): FleetPhoto => ({ id: `${id}-p${i}`, kind: "part", caption: `${job.label} — photo ${i + 1}`, src: p.url })
      ),
    };
    let status: DemoLogEntry["status"];
    if (isDamage && offRoad) status = { status: "down", statusNote: notes.trim() || "Damage reported from the route" };
    if (!isDamage && van.status !== "in_service" && backOnRoad) status = { status: "in_service" };
    onSave({ vanId: van.id, log, status });
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log a job"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 pb-8 shadow-xl dark:bg-stone-950 md:max-w-lg md:rounded-xl md:pb-5"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Log a job</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">Van</span>
            <select value={vanId} onChange={(e) => pickVan(e.target.value)} className={inputClass}>
              <option value="">Pick a van</option>
              {FLEET_LOCATIONS.map((loc) => (
                <optgroup key={loc} label={loc}>
                  {vans
                    .filter((v) => v.location === loc)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.unit} — {v.model}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">What was done</legend>
            <div className="flex flex-wrap gap-2">
              {JOBS.map((j) => (
                <button
                  key={j.key}
                  type="button"
                  onClick={() => setJobKey(j.key)}
                  aria-pressed={jobKey === j.key}
                  className={`rounded-full border px-3 py-1.5 text-sm ${jobKey === j.key
                    ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900"
                    : "border-stone-300 text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:text-stone-300"
                    }`}
                >
                  {j.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">Photos</span>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div key={p.url} className="relative aspect-[4/3] overflow-hidden rounded bg-stone-100 dark:bg-stone-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.url)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded border border-dashed border-stone-400 text-sm text-stone-600 hover:border-stone-900 hover:text-stone-900 dark:border-stone-600 dark:text-stone-400 dark:hover:border-white dark:hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5A1.5 1.5 0 014.5 7h2.3l1.4-2h7.6l1.4 2h2.3A1.5 1.5 0 0121 8.5v10a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5v-10z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                {photos.length ? "Add" : "Take photo"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
              Odometer, the part, the invoice — whatever proves the job.
            </p>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">Odometer</span>
            <input
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Miles"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Note <span className="font-normal text-stone-400">(optional)</span>
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isDamage ? "What happened?" : "Anything the next person should know"}
              className={inputClass}
            />
          </label>

          {isDamage && (
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
              <input type="checkbox" checked={offRoad} onChange={(e) => setOffRoad(e.target.checked)} className="h-4 w-4 accent-stone-900" />
              Van can&apos;t run — take it off the road
            </label>
          )}
          {!isDamage && job && van && van.status !== "in_service" && (
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
              <input type="checkbox" checked={backOnRoad} onChange={(e) => setBackOnRoad(e.target.checked)} className="h-4 w-4 accent-stone-900" />
              Fixed — put {van.unit} back on the road
            </label>
          )}

          <button
            onClick={save}
            disabled={!canSave}
            className="w-full rounded bg-stone-900 py-3 text-base font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
          >
            Save
          </button>
          <p className="text-center text-xs text-stone-500 dark:text-stone-400">
            Demo only: photos stay on this device and disappear when you reload.
          </p>
        </div>
      </div>
    </div>
  );
}
