"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { Vehicle, ServiceInterval } from "@/types/firestore";
import { ActionableItems } from "@/components/dashboard/ActionableItems";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { calculateActionItems, ActionItem } from "@/utils/maintenance";
import { Timestamp } from "firebase/firestore";
import type { MaintenanceLog, MaintenanceType } from "@/types/maintenance";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { VehicleDetailView } from "@/components/vehicles/VehicleDetailView";
import { demoVehicles, demoLogs, type DemoVehicle } from "@/data/demoData";

// Helper to convert DemoVehicle to formal Vehicle type for the Card component
function toFormalVehicle(dv: DemoVehicle): Vehicle {
  return {
    id: dv.id,
    name: dv.name,
    type: dv.type,
    powertrain: dv.powertrain,
    year: dv.year,
    make: dv.make,
    model: dv.model,
    trim: dv.trim || "",
    engine: dv.engine || "",
    transmission: dv.transmission || "",
    drivetrain: dv.drivetrain || "",
    currentMileage: dv.currentMileage,
    estimatedAnnualMileage: dv.estimatedAnnualMileage,
    photoPath: dv.image,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
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

// Per-vehicle oil change intervals (miles)
const vehicleOilIntervals: Record<string, number> = {
  f150: 5000,
  yukon: 3000,
  rzr: 50,
};

function getDemoActionItems(): ActionItem[] {
  const vehicles: Vehicle[] = demoVehicles.map((dv) => {
    const intervals: ServiceInterval[] = [];
    const isElectric = dv.powertrain === "electric";

    if (dv.type === "mower") {
      if (isElectric) {
        intervals.push(
          {
            id: "demo-mower-e-battery",
            name: "Battery Check",
            type: "time",
            timeIntervalMonths: 12,
            targetMaintenanceType: "battery",
            notes: "Check battery health and connections",
          },
          {
            id: "demo-mower-e-blades",
            name: "Blade Sharpening",
            type: "seasonal",
            season: "spring",
            targetMaintenanceType: "blade_sharpening",
            notes: "Sharpen or replace blades",
          },
          {
            id: "demo-mower-e-inspection",
            name: "Inspection",
            type: "seasonal",
            season: "spring",
            targetMaintenanceType: "inspection",
            notes: "Inspect deck, wheels, and electrical connections",
          }
        );
      } else {
        intervals.push(
          {
            id: "demo-mower-oil",
            name: "Oil Change",
            type: "seasonal",
            season: "spring",
            targetMaintenanceType: "oil_change",
            notes: "Annual oil change before mowing season",
          },
          {
            id: "demo-mower-blades",
            name: "Blade Sharpening",
            type: "seasonal",
            season: "spring",
            targetMaintenanceType: "blade_sharpening",
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
      }
    } else if (dv.type === "snowblower") {
      if (isElectric) {
        intervals.push(
          {
            id: "demo-snow-e-battery",
            name: "Battery Check",
            type: "time",
            timeIntervalMonths: 12,
            targetMaintenanceType: "battery",
            notes: "Check battery health and connections",
          },
          {
            id: "demo-snow-e-auger",
            name: "Auger/Belt Check",
            type: "seasonal",
            season: "fall",
            notes: "Check auger, belts, and shear pins",
          },
          {
            id: "demo-snow-e-inspection",
            name: "Inspection",
            type: "seasonal",
            season: "fall",
            targetMaintenanceType: "inspection",
            notes: "Inspect auger, chute, and electrical connections",
          }
        );
      } else {
        intervals.push(
          {
            id: "demo-snow-oil",
            name: "Oil Change",
            type: "seasonal",
            season: "fall",
            targetMaintenanceType: "oil_change",
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
      }
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

    if ((dv.type === "mower" || dv.type === "snowblower") && !isElectric) {
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
      powertrain: dv.powertrain,
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
      photoPath: dv.image,
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
                  Sign In
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
