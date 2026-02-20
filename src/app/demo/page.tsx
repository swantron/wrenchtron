"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { formatMileage } from "@/utils/vehicleUtils";
import type { Vehicle, VehicleType, ServiceInterval } from "@/types/firestore";
import { ActionableItems } from "@/components/dashboard/ActionableItems";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { calculateActionItems, ActionItem } from "@/utils/maintenance";
import {
  computeSummary,
  MaintenanceSummary,
} from "@/components/dashboard/MaintenanceSummary";
import { Timestamp } from "firebase/firestore";
import type { MaintenanceLog, MaintenanceType } from "@/types/maintenance";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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
  estimatedAnnualMileage?: number;
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
    estimatedAnnualMileage: 15000,
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
    estimatedAnnualMileage: 5000,
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
    estimatedAnnualMileage: 1000,
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
    currentMileage: 999999,
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
    currentMileage: 999999,
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
  if (!cents) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function toMaintenanceLogs(vehicleId: string): MaintenanceLog[] {
  return (demoLogs[vehicleId] || []).map((dl) => ({
    id: dl.id,
    maintenanceType: dl.maintenanceType as MaintenanceType,
    date: Timestamp.fromDate(new Date(dl.date + "T00:00:00")),
    mileage: dl.mileage,
    cost: dl.cost,
    shop: dl.shop,
    notes: dl.notes,
    details: dl.details,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    receiptPaths: [],
  }));
}

// --- Components ---

function LogDetails({ log }: { log: DemoLog }) {
  const d = log.details;
  if (!d || Object.keys(d).length === 0) return null;

  return (
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
        </>
      )}

      {(log.maintenanceType === "tire_rotation" ||
        log.maintenanceType === "tire_replacement") && (
        <>
          {d.positions && (
            <p className="col-span-2 text-gray-500 dark:text-gray-400">
              Pos:{" "}
              <span className="text-gray-700 dark:text-gray-300">
                {String(d.positions)}
              </span>
            </p>
          )}
          {d.treadDepth && (
            <p className="text-gray-500 dark:text-gray-400">
              Tread:{" "}
              <span className="text-gray-700 dark:text-gray-300">
                {d.treadDepth}
              </span>
            </p>
          )}
          {d.pressure && (
            <p className="text-gray-500 dark:text-gray-400">
              PSI:{" "}
              <span className="text-gray-700 dark:text-gray-300">
                {d.pressure}
              </span>
            </p>
          )}
        </>
      )}

      {(log.maintenanceType === "brake_pads" ||
        log.maintenanceType === "brake_rotors") && (
        <>
          {d.position && (
            <p className="text-gray-500 dark:text-gray-400">
              Pos:{" "}
              <span className="text-gray-700 dark:text-gray-300 capitalize">
                {d.position}
              </span>
            </p>
          )}
          {d.brand && (
            <p className="text-gray-500 dark:text-gray-400">
              Brand:{" "}
              <span className="text-gray-700 dark:text-gray-300">{d.brand}</span>
            </p>
          )}
          {d.padThickness && (
            <p className="text-gray-500 dark:text-gray-400">
              Pads:{" "}
              <span className="text-gray-700 dark:text-gray-300">
                {d.padThickness}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}

function LogItem({ log }: { log: DemoLog }) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/30">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              {typeLabels[log.maintenanceType] || log.maintenanceType}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">
                {new Date(log.date + "T00:00:00").toLocaleDateString()}
              </span>
              {log.mileage > 0 && (
                <>
                  <span>&middot;</span>
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                    {log.mileage.toLocaleString()} mi
                  </span>
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
        <div className="flex items-start gap-3">
          <Link
            href="/login"
            className="rounded-lg p-1.5 text-gray-300 opacity-0 transition-all hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            title="Sign in to edit"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>
          <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
            {formatCost(log.cost)}
          </p>
        </div>
      </div>

      <LogDetails log={log} />

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

function VehicleCard({
  vehicle,
  onClick,
}: {
  vehicle: DemoVehicle;
  onClick: () => void;
}) {
  const logs = toMaintenanceLogs(vehicle.id);
  const summary = computeSummary(logs, vehicle.currentMileage);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500/50">
      <button onClick={onClick} className="block w-full text-left">
        <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900">
          <NextImage
            src={vehicle.image}
            alt={vehicle.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </div>

        <div className="p-5">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {vehicle.name}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          </div>
          <div className="mt-4">
            <MaintenanceSummary summary={summary} />
          </div>
        </div>
      </button>

      <Link
        href="/login"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 active:scale-95"
        title="Sign in to log service"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Link>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </dd>
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
  const maintenanceLogs = toMaintenanceLogs(vehicle.id);
  const summary = computeSummary(maintenanceLogs, vehicle.currentMileage);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {vehicle.name}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to Fleet
        </button>
      </div>

      <div className="relative mt-6 aspect-[3/1] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-xl dark:border-gray-800">
        <NextImage
          src={vehicle.image}
          alt={vehicle.name}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left: Status + Specs + CTA */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Service Status
            </h3>
            <MaintenanceSummary summary={summary} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vehicle Specs
            </h3>
            <dl className="space-y-4">
              {formatMileage(vehicle.currentMileage, vehicle.type) && (
                <DetailItem
                  label="Current Mileage"
                  value={`${formatMileage(vehicle.currentMileage, vehicle.type)} mi`}
                />
              )}
              {vehicle.engine && (
                <DetailItem label="Engine" value={vehicle.engine} />
              )}
              {vehicle.transmission && (
                <DetailItem label="Transmission" value={vehicle.transmission} />
              )}
              {vehicle.drivetrain && (
                <DetailItem label="Drivetrain" value={vehicle.drivetrain} />
              )}
            </dl>
          </div>

          <div className="rounded-2xl bg-blue-600 p-8 text-white shadow-xl shadow-blue-500/20">
            <h4 className="text-lg font-black leading-tight">
              Track your own fleet?
            </h4>
            <p className="mt-2 text-sm font-semibold text-blue-100 leading-relaxed">
              Sign up free and start logging maintenance for all your vehicles.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-white py-3 text-center text-sm font-black text-blue-600 transition-all hover:bg-blue-50"
            >
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Right: Maintenance History */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Maintenance History
            </h2>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Log Service
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Conversion Helpers ---

// Per-vehicle oil change intervals (miles)
const vehicleOilIntervals: Record<string, number> = {
  f150: 5000,
  yukon: 3000,
  rzr: 50,
};

function getDemoActionItems(): ActionItem[] {
  const vehicles: Vehicle[] = demoVehicles.map((dv) => {
    const intervals: ServiceInterval[] = [];

    if (dv.type === "mower") {
      intervals.push(
        {
          id: "demo-mower-oil",
          name: "Oil Change",
          type: "seasonal",
          season: "spring",
          notes: "Annual oil change before mowing season",
        },
        {
          id: "demo-mower-blades",
          name: "Blade Sharpening",
          type: "seasonal",
          season: "spring",
          notes: "Sharpen or replace blades",
        },
        {
          id: "demo-mower-winter",
          name: "Winterize",
          type: "seasonal",
          season: "fall",
          notes: "Stabilize fuel, remove battery",
        }
      );
    } else if (dv.type === "snowblower") {
      intervals.push(
        {
          id: "demo-snow-oil",
          name: "Oil Change",
          type: "seasonal",
          season: "fall",
          notes: "Annual oil change before winter",
        },
        {
          id: "demo-snow-auger",
          name: "Auger/Belt Check",
          type: "seasonal",
          season: "fall",
          notes: "Check auger, belts, and shear pins",
        },
        {
          id: "demo-snow-summer",
          name: "Summerize",
          type: "seasonal",
          season: "spring",
          notes: "Stabilize fuel, drain carb",
        }
      );
    } else {
      intervals.push(
        {
          id: "demo-oil",
          name: "Oil Change",
          type: "composite",
          targetMaintenanceType: "oil_change",
          mileageInterval: vehicleOilIntervals[dv.id] ?? 5000,
          timeIntervalMonths: 6,
          notes: "Regular oil change",
        },
        {
          id: "demo-tire",
          name: "Tire Rotation",
          type: "mileage",
          targetMaintenanceType: "tire_rotation",
          mileageInterval: 6000,
          isOptional: true,
          notes: "Rotate tires",
        },
        {
          id: "demo-tire-replace",
          name: "Tire Replacement",
          type: "mileage",
          targetMaintenanceType: "tire_replacement",
          isComponentBased: true,
          componentInstallationType: "tire_replacement",
          totalLifeMileage: 60000,
          notes: "Full set of tires",
        },
        {
          id: "demo-air-filter",
          name: "Engine Air Filter",
          type: "mileage",
          targetMaintenanceType: "air_filter",
          mileageInterval: 30000,
          notes: "Replace engine air filter",
        }
      );
    }

    if (dv.type === "mower" || dv.type === "snowblower") {
      intervals.push({
        id: `demo-${dv.id}-plugs`,
        name: "Spark Plugs",
        type: "time",
        targetMaintenanceType: "spark_plugs",
        timeIntervalMonths: 36,
        notes: "Replace spark plugs every 3 years",
      });
    }

    return {
      id: dv.id,
      name: dv.name,
      type: dv.type,
      year: dv.year,
      make: dv.make,
      model: dv.model,
      trim: dv.trim,
      currentMileage: dv.currentMileage,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      serviceIntervals: intervals,
      estimatedAnnualMileage: dv.estimatedAnnualMileage,
    };
  });

  let allItems: ActionItem[] = [];

  vehicles.forEach((vehicle) => {
    const logs = toMaintenanceLogs(vehicle.id!);
    const vehicleItems = calculateActionItems(vehicle, logs);
    allItems = [...allItems, ...vehicleItems];
  });

  const statusRank = { overdue: 0, due_soon: 1, upcoming: 2 };
  allItems.sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }
    const aDays = a.remainingDays ?? 9999;
    const bDays = b.remainingDays ?? 9999;
    return aDays - bDays;
  });

  return allItems;
}

// --- Page ---

export default function DemoPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">(
    "overview"
  );

  const selected = selectedId
    ? demoVehicles.find((v) => v.id === selectedId)
    : null;

  const actionItems = getDemoActionItems();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
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
            <ThemeToggle />
            <span className="hidden text-xs font-bold text-gray-400 uppercase tracking-widest md:block">
              Ready to scale?
            </span>
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {selected ? (
          <VehicleDetail
            vehicle={selected}
            logs={demoLogs[selected.id] || []}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  My Garage
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/50 sm:w-fit">
              <button
                onClick={() => setActiveTab("overview")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === "overview"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === "timeline"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Timeline
              </button>
            </div>

            {activeTab === "overview" ? (
              <>
                {actionItems.length > 0 && (
                  <ActionableItems items={actionItems} />
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {demoVehicles.map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      onClick={() => setSelectedId(v.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <TimelineView items={actionItems} />
            )}

            <div className="mt-16 overflow-hidden rounded-[2rem] bg-gray-900 p-1 shadow-2xl">
              <div className="rounded-[1.8rem] bg-gray-800/50 p-12 text-center border border-white/5">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Unlock Full Capability
                </h3>
                <p className="mx-auto mt-4 max-w-sm text-lg font-medium text-gray-400">
                  Track fuel efficiency, store maintenance receipts, and manage
                  multiple fleets in one premium dashboard.
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
