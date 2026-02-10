"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { addMaintenanceLog } from "@/lib/firebase/firestore";
import { OilChangeFields } from "./OilChangeFields";
import { ReceiptUpload } from "./ReceiptUpload";
import type { MaintenanceType, OilChangeDetails } from "@/types/maintenance";

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
}

export function MaintenanceForm({ vehicleId }: MaintenanceFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [maintenanceType, setMaintenanceType] =
    useState<MaintenanceType>("oil_change");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [shop, setShop] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptPaths, setReceiptPaths] = useState<string[]>([]);
  const [oilDetails, setOilDetails] = useState<OilChangeDetails>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!date || !mileage) {
      setError("Please fill in date and mileage.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const costCents = cost ? Math.round(parseFloat(cost) * 100) : 0;
      const details = maintenanceType === "oil_change" ? oilDetails : {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logData: any = {
        maintenanceType,
        date: Timestamp.fromDate(new Date(date + "T00:00:00")),
        mileage: parseInt(mileage),
        cost: costCents,
        receiptPaths,
        details,
      };
      if (shop) logData.shop = shop;
      if (notes) logData.notes = notes;

      await addMaintenanceLog(user.uid, vehicleId, logData);

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
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            Oil Change Details
          </h3>
          <OilChangeFields details={oilDetails} onChange={setOilDetails} />
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
          {saving ? "Saving..." : "Log Maintenance"}
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
