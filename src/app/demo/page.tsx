"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { tracksMileage } from "@/lib/vehicleUtils";
import type { VehicleType } from "@/types/firestore";

interface DemoVehicle {
  id: string;
  name: string;
  type: VehicleType;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  currentMileage: number;
  intervalMileage: number;
  nextServiceMileage: number;
  image: string;
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
    id: "f150",
    name: "The Tremor",
    type: "truck",
    year: 2023,
    make: "Ford",
    model: "F-150",
    trim: "Tremor",
    engine: "3.5L V6 EcoBoost",
    transmission: "10-Speed Auto",
    drivetrain: "4WD w/ Hi-Lock",
    currentMileage: 12450,
    intervalMileage: 5000,
    nextServiceMileage: 15000,
    image: "/images/demo/f150_hero.png",
  },
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
    intervalMileage: 3000,
    nextServiceMileage: 190000,
    image: "/images/demo/yukon.jpg",
  },
  {
    id: "rzr",
    name: "The RZR",
    type: "atv",
    year: 2017,
    make: "Polaris",
    model: "RZR 900",
    trim: "4-Seater",
    engine: "875cc ProStar Twin",
    transmission: "Automatic PVT",
    drivetrain: "AWD / 2WD",
    currentMileage: 4820,
    intervalMileage: 50,
    nextServiceMileage: 4850,
    image: "/images/demo/rzr.jpg",
  },
  {
    id: "mower",
    name: "The Lawn King",
    type: "mower",
    year: 2021,
    make: "John Deere",
    model: "X350",
    trim: "42\" Deck",
    engine: "18.5 HP V-Twin",
    transmission: "Hydrostatic",
    drivetrain: "RWD",
    currentMileage: 999999, // Placeholder - mowers don't track mileage
    intervalMileage: 50, // Hours-based interval (simulated)
    nextServiceMileage: 999999,
    image: "/images/demo/mower.jpg",
  },
  {
    id: "snowblower",
    name: "The Blizzard Buster",
    type: "snowblower",
    year: 2019,
    make: "Ariens",
    model: "Deluxe 28",
    trim: "SHO",
    engine: "306cc Ariens AX",
    transmission: "Auto-Turn",
    drivetrain: "Track Drive",
    currentMileage: 999999, // Placeholder - snowblowers don't track mileage
    intervalMileage: 25, // Seasonal interval (simulated)
    nextServiceMileage: 999999,
    image: "/images/demo/snowblower.jpg",
  },
];

const demoLogs: Record<string, DemoLog[]> = {
  f150: [
    {
      id: "f1",
      maintenanceType: "oil_change",
      date: "2026-01-15",
      mileage: 10000,
      cost: 8995,
      shop: "Ford Dealership",
      notes: "First service, full synthetic.",
      details: {
        oilType: "full_synthetic",
        oilWeight: "5W-30",
        oilBrand: "Motorcraft",
      },
    },
    {
      id: "f2",
      maintenanceType: "inspection",
      date: "2026-01-15",
      mileage: 10000,
      cost: 0,
      shop: "Ford Dealership",
      notes: "Multi-point inspection, all green.",
      details: {},
    },
  ],
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
  ],
  rzr: [
    {
      id: "r1",
      maintenanceType: "oil_change",
      date: "2025-10-20",
      mileage: 4800,
      cost: 4500,
      shop: "Home / Garage",
      notes: "Post-season change. Engine oil and filter.",
      details: {
        oilType: "synthetic",
        oilWeight: "5W-50",
        oilBrand: "Polaris PS-4",
        oilQuantity: 2.5,
        filterBrand: "Polaris",
        filterPartNumber: "2521421",
      },
    },
  ],
  mower: [
    {
      id: "m1",
      maintenanceType: "oil_change",
      date: "2025-09-15",
      mileage: 0,
      cost: 2500,
      shop: "Home / Garage",
      notes: "End of season oil change. Blade sharpened.",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "John Deere",
        oilQuantity: 1.5,
      },
    },
    {
      id: "m2",
      maintenanceType: "air_filter",
      date: "2025-04-10",
      mileage: 0,
      cost: 1200,
      shop: "Home / Garage",
      notes: "Pre-season maintenance. New air filter and spark plug.",
      details: {
        filterBrand: "John Deere",
        filterPartNumber: "GY21057",
      },
    },
  ],
  snowblower: [
    {
      id: "s1",
      maintenanceType: "oil_change",
      date: "2025-11-01",
      mileage: 0,
      cost: 1800,
      shop: "Home / Garage",
      notes: "Pre-winter service. Fresh oil and spark plug.",
      details: {
        oilType: "synthetic",
        oilWeight: "5W-30",
        oilBrand: "Ariens",
        oilQuantity: 0.6,
      },
    },
    {
      id: "s2",
      maintenanceType: "inspection",
      date: "2025-03-15",
      mileage: 0,
      cost: 0,
      shop: "Home / Garage",
      notes: "Post-season inspection. Greased auger bearings.",
      details: {},
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

function getStatus(days: number, milesSince: number | null, interval: number) {
  const isOverdue = (milesSince !== null && milesSince >= interval) || days > 365;
  const isSoon = (milesSince !== null && milesSince >= interval * 0.8) || days > 300;

  if (isOverdue)
    return {
      label: "Overdue",
      color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      isAnimating: true,
    };
  if (isSoon)
    return {
      label: "Due soon",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      isAnimating: true,
    };
  return {
    label: "Up to date",
    color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    isAnimating: false,
  };
}

function ServiceProgressBar({ current, last, interval }: { current: number; last: number; interval: number }) {
  const progress = Math.min(100, Math.max(0, ((current - last) / interval) * 100));
  const isWarning = progress >= 80;
  const isCritical = progress >= 100;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        <span>Next Service</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/50">
        <div
          className={`h-full transition-all duration-1000 ease-out ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-blue-500"
            }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
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
  const milesSince = latest ? vehicle.currentMileage - latest.mileage : vehicle.currentMileage;
  const status = getStatus(days || 999, milesSince, vehicle.intervalMileage);

  return (
    <button
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500/50"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <NextImage
          src={vehicle.image}
          alt={vehicle.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h3 className="text-lg font-bold text-white leading-tight">
            {vehicle.name}
          </h3>
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">
            {vehicle.year} {vehicle.make}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {tracksMileage(vehicle.type) && (
              <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                {vehicle.currentMileage.toLocaleString()}
                <span className="ml-1 text-xs font-bold text-gray-400 uppercase tracking-tighter">mi</span>
              </p>
            )}
            {!tracksMileage(vehicle.type) && (
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {vehicle.type === "mower" ? "🚜 Lawn Equipment" : vehicle.type === "snowblower" ? "❄️ Winter Equipment" : "Equipment"}
              </p>
            )}
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${status.color} ${status.isAnimating ? "animate-pulse" : ""
              }`}
          >
            {status.isAnimating && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            {status.label}
          </span>
        </div>

        <ServiceProgressBar
          current={vehicle.currentMileage}
          last={latest?.mileage || 0}
          interval={vehicle.intervalMileage}
        />

        {latest && (
          <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-4 dark:border-gray-700/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Last Service</p>
              <p className="mt-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                {typeLabels[latest.maintenanceType] || latest.maintenanceType} &middot; {days}d ago
              </p>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

function LogItem({ log }: { log: DemoLog }) {
  const d = log.details;

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/30">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              {typeLabels[log.maintenanceType] || log.maintenanceType}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{new Date(log.date + "T00:00:00").toLocaleDateString()}</span>
              {log.mileage > 0 && (
                <>
                  <span>&middot;</span>
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">{log.mileage.toLocaleString()} mi</span>
                </>
              )}
              {log.shop && (
                <>
                  <span>&middot;</span>
                  <span>{log.shop}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
            {formatCost(log.cost)}
          </p>
        </div>
      </div>

      {d && Object.keys(d).length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 border-t border-gray-100 pt-4 dark:border-gray-700/50">
          {Object.entries(d).map(([key, value]) => value && (
            <div key={key} className="flex justify-between text-xs">
              <span className="font-bold text-gray-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{value.toString()}</span>
            </div>
          ))}
        </div>
      )}

      {log.notes && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50">
          <p className="text-sm font-medium italic text-gray-600 dark:text-gray-400">
            &ldquo;{log.notes}&rdquo;
          </p>
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
  const latest = logs[0];
  const milesSince = latest ? vehicle.currentMileage - latest.mileage : vehicle.currentMileage;
  const days = latest ? daysSince(latest.date) : null;
  const status = getStatus(days || 999, milesSince, vehicle.intervalMileage);

  return (
    <div className="pb-20">
      <button
        onClick={onBack}
        className="group mb-8 flex items-center gap-2 text-sm font-bold text-blue-600 transition-all hover:text-blue-700 dark:text-blue-400"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 transition-colors group-hover:bg-blue-100 dark:bg-blue-900/20">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </div>
        Back to fleet
      </button>

      <div className="mb-12 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="relative aspect-[3/1] w-full">
          <NextImage
            src={vehicle.image}
            alt={vehicle.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black text-white leading-none">
                {vehicle.name}
              </h2>
              <p className="mt-2 text-lg font-bold text-gray-300">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ""}
              </p>
            </div>
            <span className={`rounded-full px-6 py-2 text-sm font-black uppercase tracking-widest ${status.color} shadow-lg`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-gray-700/50 md:grid-cols-4 md:divide-x md:divide-y-0">
          {tracksMileage(vehicle.type) ? (
            <div className="p-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mileage</p>
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white tabular-nums">{vehicle.currentMileage.toLocaleString()} mi</p>
            </div>
          ) : (
            <div className="p-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</p>
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{vehicle.type === "mower" ? "🚜 Mower" : "❄️ Snowblower"}</p>
            </div>
          )}
          <div className="p-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Engine</p>
            <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white truncate">{vehicle.engine}</p>
          </div>
          <div className="p-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transmission</p>
            <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white truncate">{vehicle.transmission}</p>
          </div>
          <div className="p-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analytics</p>
            <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{logs.length} <span className="text-xs font-bold text-gray-400 uppercase">Entries</span></p>
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
          <section>
            <h3 className="mb-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Status</h3>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 dark:border-gray-700/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${status.color}`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{status.label}</p>
                  <p className="text-xs text-gray-500 font-medium">Updated 14 mins ago</p>
                </div>
              </div>
              <ServiceProgressBar current={vehicle.currentMileage} last={latest?.mileage || 0} interval={vehicle.intervalMileage} />
            </div>
          </section>

          <div className="rounded-2xl bg-blue-600 p-8 text-white shadow-xl shadow-blue-500/20">
            <h4 className="text-lg font-black leading-tight">Sync this machine to your account?</h4>
            <p className="mt-2 text-sm font-semibold text-blue-100 leading-relaxed">
              Start tracking your fleet today with high-resolution logging and predictive reminders.
            </p>
            <Link href="/login" className="mt-6 inline-block w-full rounded-xl bg-white py-3 text-center text-sm font-black text-blue-600 transition-all hover:bg-blue-50">
              Claim Fleet Now
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Maintenance History</h3>
          <div className="space-y-4">
            {logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        </div>
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white tracking-tighter"
          >
            Wrenchtron
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Demo
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-bold text-gray-400 uppercase tracking-widest md:block">Ready to scale?</span>
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {selected ? (
          <VehicleDetail
            vehicle={selected}
            logs={demoLogs[selected.id] || []}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <>
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  Your Fleet
                </h2>
                <p className="mt-1 text-lg font-semibold text-gray-500 dark:text-gray-400">
                  Select a machine to view its service intelligence.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {demoVehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  logs={demoLogs[v.id] || []}
                  onClick={() => setSelectedId(v.id)}
                />
              ))}
            </div>

            <div className="mt-16 overflow-hidden rounded-[2rem] bg-gray-900 p-1 px-1 shadow-2xl">
              <div className="rounded-[1.8rem] bg-gray-800/50 p-12 text-center border border-white/5">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white">Unlock Full Capability</h3>
                <p className="mx-auto mt-4 max-w-sm text-lg font-medium text-gray-400">
                  Track fuel efficiency, store maintenance receipts, and manage multiple fleets in one premium dashboard.
                </p>
                <Link
                  href="/login"
                  className="mt-8 inline-block rounded-2xl bg-white px-10 py-4 text-sm font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-gray-100 active:scale-95"
                >
                  Create Your Fleet
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
