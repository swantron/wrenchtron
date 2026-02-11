"use client";

import { useState } from "react";
import Link from "next/link";

// --- Demo data types ---

interface DemoVehicle {
  id: string;
  name: string;
  type: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  currentMileage: number;
}

interface DemoLog {
  id: string;
  maintenanceType: string;
  date: string;
  mileage: number;
  cost: number;
  shop?: string;
  notes?: string;
  details: Record<string, string | number | boolean | undefined>;
}

// --- Static demo data ---

const demoVehicles: DemoVehicle[] = [
  {
    id: "yukon",
    name: "The Yukon",
    type: "suv",
    year: 1996,
    make: "GMC",
    model: "Yukon",
    trim: "SLE 2-Door",
    engine: "5.7L V8 (350)",
    transmission: "4L60-E 4-Speed Auto",
    drivetrain: "4WD",
    currentMileage: 187432,
  },
  {
    id: "mower",
    name: "Honda Mower",
    type: "other",
    year: 2019,
    make: "Honda",
    model: "HRX217VKA",
    engine: "GCV200 190cc",
    currentMileage: 312,
  },
];

const demoLogs: Record<string, DemoLog[]> = {
  yukon: [
    {
      id: "y1",
      maintenanceType: "oil_change",
      date: "2025-12-14",
      mileage: 187432,
      cost: 3200,
      shop: "Home / Garage",
      notes: "Used ramps. Filter was stuck, needed strap wrench.",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "Valvoline",
        oilQuantity: 5,
        filterBrand: "Fram",
        filterPartNumber: "PH3506",
      },
    },
    {
      id: "y2",
      maintenanceType: "oil_change",
      date: "2025-09-08",
      mileage: 184210,
      cost: 2800,
      shop: "Home / Garage",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "Pennzoil",
        oilQuantity: 5,
        filterBrand: "Wix",
        filterPartNumber: "51085",
      },
    },
    {
      id: "y5",
      maintenanceType: "brake_pads",
      date: "2025-07-20",
      mileage: 183100,
      cost: 8500,
      shop: "Home / Garage",
      notes: "Front only. Rotors still had plenty of meat.",
      details: {
        position: "Front",
        brand: "Wagner ThermoQuiet",
        padType: "Semi-metallic",
      },
    },
    {
      id: "y6",
      maintenanceType: "tire_rotation",
      date: "2025-06-01",
      mileage: 181005,
      cost: 0,
      shop: "Home / Garage",
      notes: "Rotated while doing oil change. X-pattern.",
      details: {},
    },
    {
      id: "y3",
      maintenanceType: "oil_change",
      date: "2025-06-01",
      mileage: 181005,
      cost: 3100,
      shop: "Home / Garage",
      notes: "Switched back to Valvoline, runs quieter.",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "Valvoline",
        oilQuantity: 5,
        filterBrand: "Fram",
        filterPartNumber: "PH3506",
      },
    },
    {
      id: "y4",
      maintenanceType: "oil_change",
      date: "2025-02-15",
      mileage: 177800,
      cost: 2900,
      shop: "Home / Garage",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "Pennzoil",
        oilQuantity: 5,
        filterBrand: "Wix",
        filterPartNumber: "51085",
      },
    },
  ],
  mower: [
    {
      id: "m1",
      maintenanceType: "oil_change",
      date: "2025-11-02",
      mileage: 312,
      cost: 1200,
      shop: "Home",
      notes: "End of season change before winterizing.",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "Honda",
        oilQuantity: 0.47,
      },
    },
    {
      id: "m2",
      maintenanceType: "other",
      date: "2025-11-02",
      mileage: 312,
      cost: 0,
      shop: "Home",
      notes: "Winterized: drained fuel, added stabilizer to tank. Cleaned underside of deck. Stored in shed with cover.",
      details: {},
    },
    {
      id: "m3",
      maintenanceType: "spark_plugs",
      date: "2025-06-15",
      mileage: 280,
      cost: 800,
      shop: "Home",
      notes: "Old plug was fouled. Runs much smoother now.",
      details: {
        brand: "NGK",
        partNumber: "BPR6ES",
      },
    },
    {
      id: "m4",
      maintenanceType: "oil_change",
      date: "2025-04-10",
      mileage: 258,
      cost: 1200,
      shop: "Home",
      notes: "Spring start-up oil change. Oil was dark from sitting all winter.",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "Honda",
        oilQuantity: 0.47,
      },
    },
    {
      id: "m5",
      maintenanceType: "air_filter",
      date: "2025-04-10",
      mileage: 258,
      cost: 1100,
      shop: "Home",
      notes: "New filter for the season. Old one was caked with dust.",
      details: {},
    },
    {
      id: "m6",
      maintenanceType: "other",
      date: "2024-11-08",
      mileage: 240,
      cost: 500,
      shop: "Home",
      notes: "Winterized: drained fuel, stabilizer, cleaned deck, sharpened blade on bench grinder.",
      details: {},
    },
    {
      id: "m7",
      maintenanceType: "spark_plugs",
      date: "2024-04-05",
      mileage: 210,
      cost: 800,
      shop: "Home",
      notes: "Annual plug swap at start of mowing season.",
      details: {
        brand: "NGK",
        partNumber: "BPR6ES",
      },
    },
  ],
};

// --- Helpers ---

const typeLabels: Record<string, string> = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  tire_replacement: "Tire Replacement",
  brake_pads: "Brake Pads",
  brake_rotors: "Brake Rotors",
  air_filter: "Air Filter",
  cabin_filter: "Cabin Filter",
  spark_plugs: "Spark Plugs",
  transmission_fluid: "Transmission Fluid",
  coolant_flush: "Coolant Flush",
  battery: "Battery",
  wiper_blades: "Wiper Blades",
  alignment: "Alignment",
  inspection: "Inspection",
  other: "Other",
};

function formatCost(cents: number): string {
  if (!cents) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getStatus(days: number) {
  if (days <= 90)
    return {
      label: "Up to date",
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
  if (days <= 180)
    return {
      label: "Due soon",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
  return {
    label: "Overdue",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
}

// --- Components ---

function VehicleCard({
  vehicle,
  logs,
  onClick,
}: {
  vehicle: DemoVehicle;
  logs: DemoLog[];
  onClick: () => void;
}) {
  const latest = logs[0];
  const days = latest ? daysSince(latest.date) : null;
  const status =
    days !== null
      ? getStatus(days)
      : { label: "No history", color: "bg-red-100 text-red-800" };
  const milesSince = latest ? vehicle.currentMileage - latest.mileage : null;
  const unit = vehicle.type === "other" ? "hrs" : "mi";

  return (
    <button
      onClick={onClick}
      className="block w-full rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {vehicle.name}
        </h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {vehicle.currentMileage.toLocaleString()} {unit}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
        >
          {status.label}
        </span>
        {latest && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              Last:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {typeLabels[latest.maintenanceType] || latest.maintenanceType}
              </span>
            </p>
            {days !== null && <p>{days} days ago</p>}
            {milesSince !== null && milesSince > 0 && (
              <p>
                {milesSince.toLocaleString()} {unit} since
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function LogItem({ log, unit }: { log: DemoLog; unit: string }) {
  const d = log.details;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {typeLabels[log.maintenanceType] || log.maintenanceType}
          </span>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {new Date(log.date + "T00:00:00").toLocaleDateString()} &middot;{" "}
            {log.mileage.toLocaleString()} {unit}
          </p>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCost(log.cost)}
        </span>
      </div>

      {d && Object.keys(d).length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs dark:border-gray-700/50">
          {log.maintenanceType === "oil_change" && (
            <>
              {d.oilBrand && (
                <p className="text-gray-500 dark:text-gray-400">
                  Oil:{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {d.oilBrand} {d.oilWeight}
                  </span>
                </p>
              )}
              {d.filterBrand && (
                <p className="text-gray-500 dark:text-gray-400">
                  Filter:{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {d.filterBrand}
                  </span>
                </p>
              )}
              {d.oilQuantity && (
                <p className="text-gray-500 dark:text-gray-400">
                  Qty:{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {d.oilQuantity} qt
                  </span>
                </p>
              )}
            </>
          )}
          {log.maintenanceType === "brake_pads" && (
            <>
              {d.position && (
                <p className="text-gray-500 dark:text-gray-400">
                  Position:{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {d.position}
                  </span>
                </p>
              )}
              {d.brand && (
                <p className="text-gray-500 dark:text-gray-400">
                  Brand:{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {d.brand}
                  </span>
                </p>
              )}
              {d.padType && (
                <p className="text-gray-500 dark:text-gray-400">
                  Type:{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {d.padType}
                  </span>
                </p>
              )}
            </>
          )}
          {log.maintenanceType === "spark_plugs" && d.brand && (
            <p className="text-gray-500 dark:text-gray-400">
              Plug:{" "}
              <span className="text-gray-700 dark:text-gray-300">
                {d.brand} {d.partNumber}
              </span>
            </p>
          )}
        </div>
      )}

      {(log.shop || log.notes) && (
        <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
          {log.shop && <p>Shop: {log.shop}</p>}
          {log.notes && <p className="italic">&quot;{log.notes}&quot;</p>}
        </div>
      )}
    </div>
  );
}

function VehicleDetail({
  vehicle,
  logs,
  onBack,
}: {
  vehicle: DemoVehicle;
  logs: DemoLog[];
  onBack: () => void;
}) {
  const unit = vehicle.type === "other" ? "hrs" : "mi";

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
        Back to vehicles
      </button>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {vehicle.name}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim ? ` ${vehicle.trim}` : ""}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              {vehicle.type === "other" ? "Hours" : "Mileage"}
            </span>
            <p className="font-medium text-gray-900 dark:text-white">
              {vehicle.currentMileage.toLocaleString()} {unit}
            </p>
          </div>
          {vehicle.engine && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Engine</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {vehicle.engine}
              </p>
            </div>
          )}
          {vehicle.transmission && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Trans</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {vehicle.transmission}
              </p>
            </div>
          )}
          {vehicle.drivetrain && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Drivetrain
              </span>
              <p className="font-medium text-gray-900 dark:text-white">
                {vehicle.drivetrain}
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Services</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {logs.length}
            </p>
          </div>
        </div>
      </div>

      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
        Maintenance History
      </h3>
      <div className="space-y-3">
        {logs.map((log) => (
          <LogItem key={log.id} log={log} unit={unit} />
        ))}
      </div>
    </div>
  );
}

// --- Page ---

export default function DemoPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId
    ? demoVehicles.find((v) => v.id === selectedId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            Wrenchtron
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Demo
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign Up Free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {selected ? (
          <VehicleDetail
            vehicle={selected}
            logs={demoLogs[selected.id] || []}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Vehicles
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tap a vehicle to see its full maintenance history.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {demoVehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  logs={demoLogs[v.id] || []}
                  onClick={() => setSelectedId(v.id)}
                />
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This is a demo with sample data. Sign up to track your own
                vehicles, lawn equipment, and more.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
