"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { Vehicle, VehicleType, ServiceInterval } from "@/types/firestore";
import { ActionableItems } from "@/components/dashboard/ActionableItems";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { calculateActionItems, ActionItem } from "@/utils/maintenance";
import { Timestamp } from "firebase/firestore";
import type { MaintenanceLog, MaintenanceType } from "@/types/maintenance";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { VehicleDetailView } from "@/components/vehicles/VehicleDetailView";

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

// ... existing demo data and helpers down to getDemoActionItems ...

// I will keep the rest of the file as is, but replace the VehicleCard component and its usage.

// Helper to convert DemoVehicle to formal Vehicle type for the Card component
function toFormalVehicle(dv: DemoVehicle): Vehicle {
  return {
    id: dv.id,
    name: dv.name,
    type: dv.type,
    year: dv.year,
    make: dv.make,
    model: dv.model,
    trim: dv.trim || "",
    engine: dv.engine || "",
    transmission: dv.transmission || "",
    drivetrain: dv.drivetrain || "",
    currentMileage: dv.currentMileage,
    estimatedAnnualMileage: dv.estimatedAnnualMileage,
    photoPath: dv.image, // Use the image path as photoPath
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

// ... existing LogDetails, LogItem, and VehicleDetail components ...

// I'll replace the local VehicleCard with nothing (we use the import)
// And I'll update DemoPage to use the import.

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

function DemoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const activeTab = (tabParam === "hub" || tabParam === "timeline") ? tabParam : "garage";
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleTabChange = (tab: "garage" | "hub" | "timeline") => {
    router.push(`/demo?tab=${tab}`, { scroll: false });
  };

  const actionItems = getDemoActionItems();
  const vehicles = demoVehicles.map(v => toFormalVehicle(v));

  const selectedVehicle = selectedId ? vehicles.find(v => v.id === selectedId) : null;
  const selectedLogs = selectedId ? toMaintenanceLogs(selectedId) : [];

  return (
    <AppShell isDemo={true}>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {selectedVehicle ? (
          <VehicleDetailView
            vehicleId={selectedVehicle.id!}
            vehicle={selectedVehicle}
            logs={selectedLogs}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                  {activeTab === "garage" ? "Garage" : "Maintenance Hub"}
                </h1>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Demo Fleet
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/50 sm:w-fit">
              <button
                onClick={() => handleTabChange("garage")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "garage"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
              >
                Garage
              </button>
              <button
                onClick={() => handleTabChange("hub")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "hub"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
              >
                Hub
              </button>
              <button
                onClick={() => handleTabChange("timeline")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === "timeline"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
              >
                Timeline
              </button>
            </div>

            {activeTab === "garage" && (
              <div className="mt-6">
                <DashboardGrid
                  actionItems={actionItems}
                  vehicles={vehicles}
                  layout="garage"
                  isDemo={true}
                  onVehicleClick={(v) => setSelectedId(v.id || null)}
                />
              </div>
            )}

            {activeTab === "hub" && (
              <>
                {actionItems.length > 0 && (
                  <ActionableItems items={actionItems} />
                )}

                <div className="mt-6">
                  <DashboardGrid
                    actionItems={actionItems}
                    vehicles={vehicles}
                    layout="dashboard"
                    isDemo={true}
                    onVehicleClick={(v) => setSelectedId(v.id || null)}
                  />
                </div>
              </>
            )}

            {activeTab === "timeline" && <TimelineView items={actionItems} />}

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
    </AppShell>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-gray-950 px-4 py-8">Loading...</div>}>
      <DemoContent />
    </Suspense>
  );
}
