"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { addVehicle, updateVehicle } from "@/lib/firebase/firestore";
import { uploadVehiclePhoto } from "@/lib/firebase/storage";
import { compressImage } from "@/lib/image/compress";
import type { Vehicle, VehicleType } from "@/types/firestore";
import { VehiclePhotoUpload } from "./VehiclePhotoUpload";
import { tracksMileage, isRoadVehicle } from "@/utils/vehicleUtils";
import { vehicleFormSchema } from "@/lib/validation/vehicleSchema";
import { decodeVin } from "@/lib/nhtsa/decodeVin";

const VIN_VALID_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "atv", label: "ATV" },
  { value: "utv", label: "UTV" },
  { value: "mower", label: "Mower" },
  { value: "snowblower", label: "Snowblower" },
  { value: "boat", label: "Boat" },
  { value: "other", label: "Other" },
];

const KNOWN_VEHICLE_TYPES = new Set<string>(vehicleTypes.map((vt) => vt.value));

interface VehicleFormProps {
  vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState(vehicle?.name ?? "");
  const [type, setType] = useState<VehicleType>(
    vehicle?.type && KNOWN_VEHICLE_TYPES.has(vehicle.type) ? vehicle.type : "auto"
  );
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
  const [estimatedAnnualMileage, setEstimatedAnnualMileage] = useState(
    vehicle?.estimatedAnnualMileage?.toString() ?? ""
  );
  const [photoPath, setPhotoPath] = useState(vehicle?.photoPath ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [dirty, setDirty] = useState(false);

  useUnsavedChanges(dirty);

  useEffect(() => {
    const fieldIdMap: Record<string, string> = {
      name: "vf-name",
      type: "vf-type",
      year: "vf-year",
      make: "vf-make",
      model: "vf-model",
      trim: "vf-trim",
      currentMileage: "vf-mileage",
      estimatedAnnualMileage: "vf-annual-mileage",
      engine: "vf-engine",
      transmission: "vf-transmission",
      drivetrain: "vf-drivetrain",
      vin: "vf-vin",
      licensePlate: "vf-plate",
    };
    const firstError = Object.keys(fieldErrors)[0];
    if (firstError) {
      const id = fieldIdMap[firstError] ?? `vf-${firstError}`;
      document.getElementById(id)?.focus();
    }
  }, [fieldErrors]);

  const handleVinDecode = useCallback(async () => {
    const clean = vin.replace(/\s/g, "").toUpperCase();
    if (clean.length !== 17) return;
    setVinDecoding(true);
    try {
      const result = await decodeVin(clean);
      if (result) {
        if (result.make) setMake(result.make);
        if (result.model) setModel(result.model);
        if (result.year) setYear(String(result.year));
        if (result.trim) setTrim(result.trim);
        if (result.engine) setEngine(result.engine);
        if (result.transmission) setTransmission(result.transmission);
      }
    } finally {
      setVinDecoding(false);
    }
  }, [vin]);

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
    setVin(val);
    if (fieldErrors.vin) setFieldErrors((prev) => ({ ...prev, vin: "" }));
  };

  const handleVinBlur = () => {
    if (vin.replace(/\s/g, "").length === 17) {
      handleVinDecode();
    }
  };

  const vinLength = vin.length;
  const vinValid = VIN_VALID_REGEX.test(vin);
  const vinBorderClass =
    vinLength === 0
      ? "border-gray-300 dark:border-gray-600"
      : vinLength === 17
        ? vinValid
          ? "border-green-500 focus:border-green-500 focus:ring-green-500"
          : "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const requiresMileage = tracksMileage(type);
    const rawData = {
      name,
      type,
      year,
      make,
      model,
      trim: trim || undefined,
      currentMileage: requiresMileage && currentMileage ? currentMileage : undefined,
      estimatedAnnualMileage: estimatedAnnualMileage || undefined,
      engine: engine || undefined,
      transmission: transmission || undefined,
      drivetrain: drivetrain || undefined,
      vin: vin || undefined,
      licensePlate: licensePlate || undefined,
    };

    const result = vehicleFormSchema.safeParse(rawData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = issue.message;
      }
      if (requiresMileage && !currentMileage) {
        errors.currentMileage = "Mileage is required";
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSaving(true);
    setError("");
    setDirty(false);

    try {
      const data: Omit<Vehicle, "id" | "createdAt" | "updatedAt"> = {
        name,
        type,
        year: parseInt(year),
        make,
        model,
        currentMileage: currentMileage ? parseInt(currentMileage) : 0,
        isActive: true,
      };
      if (estimatedAnnualMileage) data.estimatedAnnualMileage = parseInt(estimatedAnnualMileage);
      if (trim) data.trim = trim;
      if (engine) data.engine = engine;
      if (transmission) data.transmission = transmission;
      if (drivetrain) data.drivetrain = drivetrain;
      if (vin) data.vin = vin;
      if (licensePlate) data.licensePlate = licensePlate;
      if (photoPath) data.photoPath = photoPath;

      if (vehicle?.id) {
        await updateVehicle(user.uid, vehicle.id, data);
        router.push(`/vehicles/detail?id=${vehicle.id}`);
      } else {
        const ref = await addVehicle(user.uid, data);

        // If we have a pending photo, upload it now that we have a vehicleId
        if (pendingFile) {
          try {
            const compressed = await compressImage(pendingFile);
            const path = await uploadVehiclePhoto(user.uid, ref.id, compressed);
            await updateVehicle(user.uid, ref.id, { photoPath: path });
          } catch (err) {
            console.error("Deferred photo upload failed:", err);
          }
        }

        router.push(`/vehicles/detail?id=${ref.id}`);
      }
    } catch (err) {
      setError("Failed to save vehicle. Please try again.");
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} onChange={() => setDirty(true)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="vf-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name *
          </label>
          <input
            id="vf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Daily Driver"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="vf-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type *
          </label>
          <select
            id="vf-type"
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
          <label htmlFor="vf-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Year *
          </label>
          <input
            id="vf-year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="1900"
            max="2100"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
          {fieldErrors.year && <p className="mt-1 text-xs text-red-600">{fieldErrors.year}</p>}
        </div>

        <div>
          <label htmlFor="vf-make" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Make *
          </label>
          <input
            id="vf-make"
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="e.g. Toyota"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
          {fieldErrors.make && <p className="mt-1 text-xs text-red-600">{fieldErrors.make}</p>}
        </div>

        <div>
          <label htmlFor="vf-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Model *
          </label>
          <input
            id="vf-model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Camry"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          />
          {fieldErrors.model && <p className="mt-1 text-xs text-red-600">{fieldErrors.model}</p>}
        </div>

        <div>
          <label htmlFor="vf-trim" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Trim
          </label>
          <input
            id="vf-trim"
            type="text"
            value={trim}
            onChange={(e) => setTrim(e.target.value)}
            placeholder="e.g. XSE"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {tracksMileage(type) && (
          <div>
            <label htmlFor="vf-mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Mileage *
            </label>
            <input
              id="vf-mileage"
              type="number"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value)}
              min="0"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            />
            {fieldErrors.currentMileage && <p className="mt-1 text-xs text-red-600">{fieldErrors.currentMileage}</p>}
          </div>
        )}

        {tracksMileage(type) && (
          <div>
            <label htmlFor="vf-annual-mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estimated Annual Mileage
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                id="vf-annual-mileage"
                type="number"
                value={estimatedAnnualMileage}
                onChange={(e) => setEstimatedAnnualMileage(e.target.value)}
                min="0"
                placeholder="e.g. 12000"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Used to predict upcoming maintenance dates based on your driving habits.
            </p>
          </div>
        )}

        {!tracksMileage(type) && (
          <div className="sm:col-span-2">
            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 {type === "mower" ? "Mowers" : type === "snowblower" ? "Snowblowers" : "This equipment"} typically don&apos;t track mileage. You can track maintenance by date and service type instead.
              </p>
            </div>
          </div>
        )}

        {isRoadVehicle(type) && (
          <>
            <div>
              <label htmlFor="vf-engine" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Engine
              </label>
              <input
                id="vf-engine"
                type="text"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                placeholder="e.g. 2.5L 4-Cylinder"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="vf-transmission" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transmission
              </label>
              <input
                id="vf-transmission"
                type="text"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                placeholder="e.g. 8-Speed Automatic"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="vf-drivetrain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Drivetrain
              </label>
              <input
                id="vf-drivetrain"
                type="text"
                value={drivetrain}
                onChange={(e) => setDrivetrain(e.target.value)}
                placeholder="e.g. FWD, AWD, 4WD"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="vf-vin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                VIN
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="vf-vin"
                  type="text"
                  value={vin}
                  onChange={handleVinChange}
                  onBlur={handleVinBlur}
                  placeholder="17-character VIN"
                  maxLength={17}
                  autoComplete="off"
                  className={`block flex-1 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${fieldErrors.vin ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "bg-white dark:border-gray-600 " + vinBorderClass}`}
                />
                <button
                  type="button"
                  onClick={handleVinDecode}
                  disabled={vin.length !== 17 || vinDecoding}
                  className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {vinDecoding ? "…" : "Decode"}
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {vinLength}/17
                  {vinLength === 17 && !vinValid && (
                    <span className="ml-1 text-red-600 dark:text-red-400">· Invalid chars (no I, O, Q)</span>
                  )}
                </span>
                {vinLength === 17 && vinValid && (
                  <span className="text-xs text-green-600 dark:text-green-400">Valid format</span>
                )}
              </div>
              {fieldErrors.vin && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.vin}</p>}
            </div>

            <div>
              <label htmlFor="vf-plate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                License Plate
              </label>
              <input
                id="vf-plate"
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </>
        )}
      </div>

      {user && (
        <VehiclePhotoUpload
          userId={user.uid}
          vehicleId={vehicle?.id}
          currentPhotoPath={photoPath}
          onUpload={setPhotoPath}
          onFileSelect={setPendingFile}
        />
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : vehicle?.id ? "Update Machine" : "Add to Garage"}
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
