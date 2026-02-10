"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { addVehicle, updateVehicle } from "@/lib/firebase/firestore";
import type { Vehicle, VehicleType } from "@/types/firestore";

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "atv", label: "ATV" },
  { value: "other", label: "Other" },
];

interface VehicleFormProps {
  vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(vehicle?.name ?? "");
  const [type, setType] = useState<VehicleType>(vehicle?.type ?? "car");
  const [year, setYear] = useState(vehicle?.year?.toString() ?? "");
  const [make, setMake] = useState(vehicle?.make ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [trim, setTrim] = useState(vehicle?.trim ?? "");
  const [engine, setEngine] = useState(vehicle?.engine ?? "");
  const [transmission, setTransmission] = useState(
    vehicle?.transmission ?? ""
  );
  const [drivetrain, setDrivetrain] = useState(vehicle?.drivetrain ?? "");
  const [vin, setVin] = useState(vehicle?.vin ?? "");
  const [licensePlate, setLicensePlate] = useState(
    vehicle?.licensePlate ?? ""
  );
  const [currentMileage, setCurrentMileage] = useState(
    vehicle?.currentMileage?.toString() ?? ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name || !year || !make || !model || !currentMileage) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        name,
        type,
        year: parseInt(year),
        make,
        model,
        currentMileage: parseInt(currentMileage),
        isActive: true,
      };
      if (trim) data.trim = trim;
      if (engine) data.engine = engine;
      if (transmission) data.transmission = transmission;
      if (drivetrain) data.drivetrain = drivetrain;
      if (vin) data.vin = vin;
      if (licensePlate) data.licensePlate = licensePlate;

      if (vehicle?.id) {
        await updateVehicle(user.uid, vehicle.id, data);
        router.push(`/vehicles/detail?id=${vehicle.id}`);
      } else {
        const ref = await addVehicle(user.uid, data);
        router.push(`/vehicles/detail?id=${ref.id}`);
      }
    } catch (err) {
      setError("Failed to save vehicle. Please try again.");
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
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Daily Driver"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as VehicleType)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {vehicleTypes.map((vt) => (
              <option key={vt.value} value={vt.value}>
                {vt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Year *
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="1900"
            max="2100"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Make *
          </label>
          <input
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="e.g. Toyota"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Model *
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Camry"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Trim
          </label>
          <input
            type="text"
            value={trim}
            onChange={(e) => setTrim(e.target.value)}
            placeholder="e.g. XSE"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Mileage *
          </label>
          <input
            type="number"
            value={currentMileage}
            onChange={(e) => setCurrentMileage(e.target.value)}
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Engine
          </label>
          <input
            type="text"
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            placeholder="e.g. 2.5L 4-Cylinder"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Transmission
          </label>
          <input
            type="text"
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            placeholder="e.g. 8-Speed Automatic"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Drivetrain
          </label>
          <input
            type="text"
            value={drivetrain}
            onChange={(e) => setDrivetrain(e.target.value)}
            placeholder="e.g. FWD, AWD, 4WD"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            VIN
          </label>
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            License Plate
          </label>
          <input
            type="text"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : vehicle?.id ? "Update Vehicle" : "Add Vehicle"}
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
