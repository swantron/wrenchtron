"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { addMaintenanceLog, updateMaintenanceLog } from "@/lib/firebase/firestore";
import { tracksMileage } from "@/utils/vehicleUtils";
import { OilChangeFields } from "./OilChangeFields";
import { TireFields } from "./TireFields";
import { BrakeFields } from "./BrakeFields";
import { ReceiptUpload } from "./ReceiptUpload";
import type { VehicleType } from "@/types/firestore";
import type {
  MaintenanceLog,
  MaintenanceType,
  OilChangeDetails,
  TireDetails,
  BrakeDetails,
} from "@/types/maintenance";

const maintenanceTypes: { value: MaintenanceType; label: string }[] = [
  { value: "oil_change", label: "Oil Change" },
  { value: "tire_rotation", label: "Tire Rotation" },
  { value: "tire_replacement", label: "Tire Replacement" },
  { value: "brake_pads", label: "Brake Pads" },
  { value: "brake_rotors", label: "Brake Rotors" },
  { value: "air_filter", label: "Air Filter" },
  { value: "cabin_filter", label: "Cabin Filter" },
  { value: "spark_plugs", label: "Spark Plugs" },
  { value: "transmission_fluid", label: "Transmission Fluid" },
  { value: "coolant_flush", label: "Coolant Flush" },
  { value: "battery", label: "Battery" },
  { value: "wiper_blades", label: "Wiper Blades" },
  { value: "alignment", label: "Alignment" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Other" },
];

interface MaintenanceFormProps {
  vehicleId: string;
  vehicleType?: VehicleType;
  initialType?: MaintenanceType;
  initialData?: MaintenanceLog;
}

export function MaintenanceForm({ vehicleId, vehicleType, initialType, initialData }: MaintenanceFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const requiresMileage = tracksMileage(vehicleType ?? "car");

  const [maintenanceType, setMaintenanceType] =
    useState<MaintenanceType>(initialData?.maintenanceType ?? initialType ?? "oil_change");
  const [date, setDate] = useState(initialData?.date ? (initialData.date as Timestamp).toDate().toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [mileage, setMileage] = useState(initialData?.mileage.toString() ?? "");
  const [cost, setCost] = useState(initialData?.cost ? (initialData.cost / 100).toString() : "");
  const [shop, setShop] = useState(initialData?.shop ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [receiptPaths, setReceiptPaths] = useState<string[]>(initialData?.receiptPaths ?? []);
  const [oilDetails, setOilDetails] = useState<OilChangeDetails>(initialData?.details as OilChangeDetails ?? {});
  const [tireDetails, setTireDetails] = useState<TireDetails>(initialData?.details as TireDetails ?? {});
  const [brakeDetails, setBrakeDetails] = useState<BrakeDetails>(initialData?.details as BrakeDetails ?? {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!date || (requiresMileage && !mileage)) {
      setError(requiresMileage ? "Please fill in date and mileage." : "Please fill in the date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const costCents = cost ? Math.round(parseFloat(cost) * 100) : 0;
      let details = {};

      if (maintenanceType === "oil_change") {
        details = oilDetails;
      } else if (
        maintenanceType === "tire_rotation" ||
        maintenanceType === "tire_replacement"
      ) {
        details = tireDetails;
      } else if (
        maintenanceType === "brake_pads" ||
        maintenanceType === "brake_rotors"
      ) {
        details = brakeDetails;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logData: any = {
        maintenanceType,
        date: Timestamp.fromDate(new Date(date + "T00:00:00")),
        mileage: mileage ? parseInt(mileage) : 0,
        cost: costCents,
        receiptPaths,
        details,
      };

      if (shop) logData.shop = shop;
      if (notes) logData.notes = notes;

      if (initialData?.id) {
        await updateMaintenanceLog(user.uid, vehicleId, initialData.id, logData);
      } else {
        await addMaintenanceLog(user.uid, vehicleId, logData);
      }

      router.push(`/vehicles/detail?id=${vehicleId}`);
    } catch (err) {
      setError("Failed to save maintenance log. Please try again.");
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Maintenance Type *
          </label>
          <select
            value={maintenanceType}
            onChange={(e) =>
              setMaintenanceType(e.target.value as MaintenanceType)
            }
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {maintenanceTypes.map((mt) => (
              <option key={mt.value} value={mt.value}>
                {mt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        {requiresMileage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mileage *
            </label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              min="0"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cost ($)
          </label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Shop / Location
          </label>
          <input
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="e.g. Jiffy Lube"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {maintenanceType === "oil_change" && (
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/20">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Oil Change Details
          </h3>
          <OilChangeFields details={oilDetails} onChange={setOilDetails} />
        </div>
      )}

      {(maintenanceType === "tire_rotation" ||
        maintenanceType === "tire_replacement") && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/20">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Tire Service Details
            </h3>
            <TireFields details={tireDetails} onChange={setTireDetails} />
          </div>
        )}

      {(maintenanceType === "brake_pads" ||
        maintenanceType === "brake_rotors") && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/20">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Brake Service Details
            </h3>
            <BrakeFields details={brakeDetails} onChange={setBrakeDetails} />
          </div>
        )}

      {user && (
        <ReceiptUpload
          userId={user.uid}
          vehicleId={vehicleId}
          receiptPaths={receiptPaths}
          onUpload={(path) => setReceiptPaths((prev) => [...prev, path])}
          onRemove={(i) =>
            setReceiptPaths((prev) => prev.filter((_, idx) => idx !== i))
          }
        />
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : initialData?.id ? "Update Log" : "Log Maintenance"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
