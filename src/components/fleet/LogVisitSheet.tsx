"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { useBackToClose } from "@/components/fleet/useBackToClose";
import { PHOTO_KIND_LABELS } from "@/components/fleet/boardData";
import { useToast } from "@/components/ui/Toast";
import { logVisit, OfflinePhotosError } from "@/lib/firebase/fleet";
import type { FleetPhotoKind, FleetSite, FleetVehicle } from "@/types/fleet";
import type { MaintenanceType } from "@/types/maintenance";

// Logging a visit from a phone: pick the van, tick what was done, snap the
// odometer, the part and the invoice, save. One visit can cover several services.

interface ServiceOption {
  key: string;
  label: string;
  type: MaintenanceType;
  /** Shown in history instead of the maintenance type. */
  title?: string;
}

const SERVICES: ServiceOption[] = [
  { key: "oil", label: "Oil change", type: "oil_change" },
  { key: "rotation", label: "Tire rotation", type: "tire_rotation" },
  { key: "tires", label: "New tires", type: "tire_replacement" },
  { key: "brakes", label: "Brakes", type: "brake_pads" },
  { key: "inspection", label: "Inspection", type: "inspection" },
  { key: "cabin", label: "Cabin filter", type: "cabin_filter" },
  { key: "damage", label: "Damage / issue", type: "other", title: "Damage report" },
  { key: "other", label: "Other", type: "other" },
];

const PHOTO_KINDS: FleetPhotoKind[] = ["odometer", "part", "invoice", "tire", "brake", "damage", "other"];

interface Draft {
  file: File;
  url: string;
  kind: FleetPhotoKind;
}

const inputClass =
  "w-full rounded border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-stone-300";
const labelClass = "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LogVisitSheet({
  fleetId,
  user,
  userName,
  vehicles,
  sites,
  initialVanId,
  onSaved,
  onClose,
}: {
  fleetId: string;
  user: User;
  userName: string;
  vehicles: FleetVehicle[];
  sites: FleetSite[];
  initialVanId?: string;
  onSaved: (vehicleId: string) => void;
  onClose: () => void;
}) {
  const close = useBackToClose("wrenchtronLogSheet", onClose);
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [vanId, setVanId] = useState(initialVanId ?? "");
  const van = vehicles.find((v) => v.id === vanId);
  const [picked, setPicked] = useState<string[]>([]);
  // Starts empty: a prefilled last reading gets saved unchanged, and every
  // due-by-mileage after that is off.
  const [mileage, setMileage] = useState("");
  const [date, setDate] = useState(today);
  const [shop, setShop] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Draft[]>([]);
  const [offRoad, setOffRoad] = useState(true);
  const [backOnRoad, setBackOnRoad] = useState(true);
  const [saving, setSaving] = useState(false);

  // Keep the page behind from scrolling while the sheet is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const isDamage = picked.includes("damage");
  const toggle = (key: string) =>
    setPicked((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file, i): Draft => {
        // First shot of a visit is usually the odometer
        const kind: FleetPhotoKind = isDamage ? "damage" : photos.length === 0 && i === 0 ? "odometer" : "part";
        return { file, url: URL.createObjectURL(file), kind };
      });
    setPhotos((current) => [...current, ...added]);
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    setPhotos((current) => current.filter((p) => p.url !== url));
  };

  const setKind = (url: string, kind: FleetPhotoKind) =>
    setPhotos((current) => current.map((p) => (p.url === url ? { ...p, kind } : p)));

  const miles = Number(mileage.replace(/[^0-9]/g, ""));
  const cents = Math.round(Number(cost.replace(/[^0-9.]/g, "") || 0) * 100);
  const canSave = !!van && picked.length > 0 && miles > 0 && !!date && !saving;
  const lastMiles = van?.currentMileage ?? 0;
  // Catch typos (an extra digit) before they move the van's odometer for good
  const milesWarning =
    !lastMiles || !miles
      ? null
      : miles < lastMiles && date === today()
        ? `Lower than the last reading (${lastMiles.toLocaleString()} mi). Check the number.`
        : miles > lastMiles + 10_000
          ? `${(miles - lastMiles).toLocaleString()} mi more than the last reading (${lastMiles.toLocaleString()} mi). Check the number.`
          : null;

  const save = async () => {
    if (!van || !canSave) return;
    setSaving(true);
    let status: { status: "down" | "in_service"; statusNote?: string } | undefined;
    // The note's first line is the reason the board shows; the whole note stays on the log
    const reason = notes.trim().split("\n")[0].slice(0, 120);
    if (isDamage && offRoad) status = { status: "down", statusNote: reason || "Damage reported" };
    if (!isDamage && van.status !== "in_service" && backOnRoad) status = { status: "in_service" };
    try {
      const [y, m, d] = date.split("-").map(Number);
      const when = new Date(y, m - 1, d);
      // Today's visit keeps the time it was logged, so same-day visits stay in order
      if (date === today()) when.setHours(new Date().getHours(), new Date().getMinutes());
      else when.setHours(12);
      const { queued } = await logVisit(fleetId, van, user, userName, {
        services: SERVICES.filter((s) => picked.includes(s.key)).map((s) => ({ type: s.type, title: s.title })),
        date: when,
        mileage: miles,
        cost: cents,
        shop: shop.trim() || "In the yard",
        notes,
        photos: photos.map((p) => ({ file: p.file, kind: p.kind })),
        status,
      });
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      showToast(
        queued ? `Saved on this phone. ${van.unit} will update for everyone once you have signal.` : `Logged on ${van.unit}.`,
        queued ? "info" : "success"
      );
      onSaved(van.id!);
      close();
    } catch (error) {
      console.error("Failed to log visit:", error);
      showToast(
        error instanceof OfflinePhotosError
          ? "No signal, so the photos can't upload. Try again when you have signal, or remove the photos to save the job now."
          : "Couldn't save. Check your signal and try again — nothing was lost here.",
        "error"
      );
      setSaving(false);
    }
  };

  const vansBySite = [...sites, { id: "", name: "No site" }]
    .map((site) => ({
      site,
      vans: vehicles
        .filter((v) => (site.id ? v.siteId === site.id : !sites.some((s) => s.id === v.siteId)))
        .sort((a, b) => a.unit.localeCompare(b.unit, undefined, { numeric: true })),
    }))
    .filter((g) => g.vans.length);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center" onClick={saving ? undefined : close}>
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
            disabled={saving}
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
            <span className={labelClass}>Van</span>
            <select value={vanId} onChange={(e) => setVanId(e.target.value)} className={inputClass}>
              <option value="">Pick a van</option>
              {vansBySite.map(({ site, vans }) => (
                <optgroup key={site.id || "none"} label={site.name}>
                  {vans.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.unit}
                      {v.model ? ` — ${v.model}` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
              What was done <span className="font-normal text-stone-400">(tick all)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => {
                const on = picked.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggle(s.key)}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1.5 text-sm ${on
                      ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900"
                      : "border-stone-300 text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:text-stone-300"
                      }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <span className={labelClass}>Photos</span>
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
                <div key={p.url}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded bg-stone-100 dark:bg-stone-900">
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
                  <select
                    value={p.kind}
                    onChange={(e) => setKind(p.url, e.target.value as FleetPhotoKind)}
                    aria-label="What the photo shows"
                    className="mt-1 w-full rounded border border-stone-300 bg-white px-1 py-0.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                  >
                    {PHOTO_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {PHOTO_KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
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

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Odometer</span>
              <input
                inputMode="numeric"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder={lastMiles ? `Last ${lastMiles.toLocaleString()}` : "Miles"}
                aria-describedby={milesWarning ? "odometer-warning" : undefined}
                className={inputClass}
              />
            </label>
            {milesWarning && (
              <p id="odometer-warning" role="status" className="col-span-2 -mt-1 text-sm text-amber-700 dark:text-amber-400">
                {milesWarning}
              </p>
            )}
            <label className="block">
              <span className={labelClass}>Date</span>
              <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Shop</span>
              <input value={shop} onChange={(e) => setShop(e.target.value)} maxLength={80} placeholder="In the yard" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>
                Cost <span className="font-normal text-stone-400">($)</span>
              </span>
              <input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className={inputClass} />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>
              Note <span className="font-normal text-stone-400">(optional)</span>
            </span>
            <textarea
              value={notes}
              maxLength={2000}
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
          {!isDamage && picked.length > 0 && van && van.status !== "in_service" && (
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
            {saving ? (photos.length ? `Uploading ${photos.length} ${photos.length === 1 ? "photo" : "photos"}…` : "Saving…") : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
