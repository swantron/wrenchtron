"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { removeFleetVan, updateFleetVan } from "@/lib/firebase/fleet";
import { FLEET_SCHEDULE_PRESETS, scheduleFor } from "@/data/fleetSchedules";
import type { FleetSite, FleetVehicle } from "@/types/fleet";

const inputClass =
  "w-full rounded border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-stone-300 sm:text-sm";
const labelClass = "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

/** Managers: fix a van's unit, plate, site, odometer or schedule, or take it out of the fleet. */
export function VanEditor({
  fleetId,
  vehicle,
  sites,
  onRemoved,
}: {
  fleetId: string;
  vehicle: FleetVehicle;
  sites: FleetSite[];
  onRemoved: () => void;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState(vehicle.unit);
  const [plate, setPlate] = useState(vehicle.licensePlate ?? "");
  const [siteId, setSiteId] = useState(vehicle.siteId);
  const [mileage, setMileage] = useState(String(vehicle.currentMileage || ""));
  const [scheduleId, setScheduleId] = useState(vehicle.scheduleId ?? scheduleFor(vehicle.powertrain).id);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const start = () => {
    setUnit(vehicle.unit);
    setPlate(vehicle.licensePlate ?? "");
    setSiteId(vehicle.siteId);
    setMileage(String(vehicle.currentMileage || ""));
    setScheduleId(vehicle.scheduleId ?? scheduleFor(vehicle.powertrain).id);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const schedule = FLEET_SCHEDULE_PRESETS.find((p) => p.id === scheduleId) ?? scheduleFor(vehicle.powertrain);
    setSaving(true);
    try {
      await updateFleetVan(fleetId, vehicle.id!, {
        unit: unit.trim() || vehicle.unit,
        licensePlate: plate,
        siteId,
        currentMileage: Number(mileage.replace(/[^0-9]/g, "")) || 0,
        powertrain: schedule.id === "electric" ? "electric" : "gas",
        scheduleId: schedule.id,
        // Keep the van's own intervals unless the schedule changed
        serviceIntervals:
          schedule.id === vehicle.scheduleId && vehicle.serviceIntervals ? vehicle.serviceIntervals : schedule.intervals,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to update van:", error);
      showToast("Couldn't save the van. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setConfirmRemove(false);
    try {
      await removeFleetVan(fleetId, vehicle.id!);
      showToast(`Removed ${vehicle.unit}.`, "success");
      onRemoved();
    } catch (error) {
      console.error("Failed to remove van:", error);
      showToast("Couldn't remove the van. Please try again.", "error");
    }
  };

  if (!open) {
    return (
      <button onClick={start} className="mt-3 block text-sm text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline dark:text-stone-400 dark:hover:text-white">
        Edit van
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-4 max-w-md space-y-4 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>Unit</span>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} required maxLength={40} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Plate</span>
          <input value={plate} onChange={(e) => setPlate(e.target.value)} maxLength={20} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Site</span>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={inputClass}>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Odometer</span>
          <input inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>Schedule</span>
        <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} className={inputClass}>
          {FLEET_SCHEDULE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-white dark:text-stone-900"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-600 dark:text-stone-300">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          className="ml-auto text-sm text-red-600 underline-offset-4 hover:underline dark:text-red-400"
        >
          Remove from fleet
        </button>
      </div>
      <ConfirmDialog
        open={confirmRemove}
        title={`Remove ${vehicle.unit}?`}
        description="The van and its whole service history come out of the fleet. Download the service history first if you need to keep it."
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
        onCancel={() => setConfirmRemove(false)}
      />
    </form>
  );
}
