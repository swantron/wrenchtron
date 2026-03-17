import { useEffect, useRef, useState } from "react";
import { Vehicle, VehicleType } from "@/types/firestore";
import { MaintenanceLog } from "@/types/maintenance";
import { subscribeToMaintenanceLogs } from "@/lib/firebase/firestore";
import { ActionItem, calculateActionItems } from "@/utils/maintenance";
import { useAuth } from "./useAuth";

import { ServiceInterval } from "@/types/firestore";

const DEFAULT_CAR_INTERVALS: ServiceInterval[] = [
    {
        id: "default-oil",
        name: "Oil Change",
        type: "composite",
        mileageInterval: 5000,
        timeIntervalMonths: 6,
        targetMaintenanceType: "oil_change",
        notes: "Regular oil and filter change",
    },
    {
        id: "default-tire",
        name: "Tire Rotation",
        type: "mileage",
        mileageInterval: 6000,
        targetMaintenanceType: "tire_rotation",
        notes: "Rotate tires to ensure even wear",
    },
    {
        id: "default-air-filter",
        name: "Engine Air Filter",
        type: "mileage",
        mileageInterval: 30000,
        targetMaintenanceType: "air_filter",
        notes: "Replace engine air filter",
    },
];

const DEFAULT_CAR_ELECTRIC_INTERVALS: ServiceInterval[] = [
    {
        id: "default-ev-tire",
        name: "Tire Rotation",
        type: "mileage",
        mileageInterval: 6000,
        targetMaintenanceType: "tire_rotation",
        notes: "Rotate tires to ensure even wear",
    },
    {
        id: "default-ev-cabin",
        name: "Cabin Air Filter",
        type: "time",
        timeIntervalMonths: 24,
        targetMaintenanceType: "cabin_filter",
        notes: "Replace cabin air filter",
    },
    {
        id: "default-ev-brake",
        name: "Brake Inspection",
        type: "time",
        timeIntervalMonths: 24,
        targetMaintenanceType: "brake_pads",
        notes: "Inspect brakes (regen reduces wear but still needed)",
    },
    {
        id: "default-ev-inspection",
        name: "Inspection",
        type: "time",
        timeIntervalMonths: 12,
        targetMaintenanceType: "inspection",
        notes: "Annual inspection",
    },
];

const DEFAULT_ATV_INTERVALS: ServiceInterval[] = [
    {
        id: "default-atv-oil",
        name: "Oil Change",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "oil_change",
        notes: "Annual oil change at start of season",
    },
    {
        id: "default-atv-air",
        name: "Air Filter",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "air_filter",
        notes: "Inspect and replace air filter",
    },
];

const DEFAULT_ATV_ELECTRIC_INTERVALS: ServiceInterval[] = [
    {
        id: "default-atv-e-battery",
        name: "Battery Check",
        type: "time",
        timeIntervalMonths: 12,
        targetMaintenanceType: "battery",
        notes: "Check battery health and connections",
    },
    {
        id: "default-atv-e-inspection",
        name: "Inspection",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "inspection",
        notes: "Inspect brakes, tires, and electrical connections",
    },
];

const DEFAULT_BOAT_INTERVALS: ServiceInterval[] = [
    {
        id: "default-boat-oil",
        name: "Oil Change",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "oil_change",
        notes: "Annual oil change before launch",
    },
    {
        id: "default-boat-winter",
        name: "Winterize",
        type: "seasonal",
        season: "fall",
        targetMaintenanceType: "winterize",
        notes: "Winterize engine and systems",
    },
];

const DEFAULT_BOAT_ELECTRIC_INTERVALS: ServiceInterval[] = [
    {
        id: "default-boat-e-battery",
        name: "Battery Check",
        type: "time",
        timeIntervalMonths: 12,
        targetMaintenanceType: "battery",
        notes: "Check battery health and connections",
    },
    {
        id: "default-boat-e-inspection",
        name: "Inspection",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "inspection",
        notes: "Inspect motor, propeller, and electrical systems",
    },
];

const DEFAULT_MOWER_INTERVALS: ServiceInterval[] = [
    {
        id: "default-mower-oil",
        name: "Oil Change",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "oil_change",
        notes: "Annual oil change before mowing season",
    },
    {
        id: "default-mower-blades",
        name: "Blade Sharpening",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "blade_sharpening",
        notes: "Sharpen or replace blades",
    },
    {
        id: "default-mower-winter",
        name: "Winterize",
        type: "seasonal",
        season: "fall",
        targetMaintenanceType: "winterize",
        notes: "Stabilize fuel, remove battery",
    },
];

const DEFAULT_MOWER_ELECTRIC_INTERVALS: ServiceInterval[] = [
    {
        id: "default-mower-e-battery",
        name: "Battery Check",
        type: "time",
        timeIntervalMonths: 12,
        targetMaintenanceType: "battery",
        notes: "Check battery health and connections",
    },
    {
        id: "default-mower-e-blades",
        name: "Blade Sharpening",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "blade_sharpening",
        notes: "Sharpen or replace blades",
    },
    {
        id: "default-mower-e-inspection",
        name: "Inspection",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "inspection",
        notes: "Inspect deck, wheels, and electrical connections",
    },
];

const DEFAULT_SNOWBLOWER_INTERVALS: ServiceInterval[] = [
    {
        id: "default-snow-oil",
        name: "Oil Change",
        type: "seasonal",
        season: "fall",
        targetMaintenanceType: "oil_change",
        notes: "Annual oil change before winter",
    },
    {
        id: "default-snow-auger",
        name: "Auger/Belt Check",
        type: "seasonal",
        season: "fall",
        targetMaintenanceType: "inspection",
        notes: "Check auger, belts, and shear pins",
    },
    {
        id: "default-snow-summer",
        name: "Summerize",
        type: "seasonal",
        season: "spring",
        targetMaintenanceType: "summerize",
        notes: "Stabilize fuel, drain carb",
    },
];

const DEFAULT_SNOWBLOWER_ELECTRIC_INTERVALS: ServiceInterval[] = [
    {
        id: "default-snow-e-battery",
        name: "Battery Check",
        type: "time",
        timeIntervalMonths: 12,
        targetMaintenanceType: "battery",
        notes: "Check battery health and connections",
    },
    {
        id: "default-snow-e-auger",
        name: "Auger/Belt Check",
        type: "seasonal",
        season: "fall",
        notes: "Check auger, belts, and shear pins",
    },
    {
        id: "default-snow-e-inspection",
        name: "Inspection",
        type: "seasonal",
        season: "fall",
        targetMaintenanceType: "inspection",
        notes: "Inspect auger, chute, and electrical connections",
    },
];

function getDefaultIntervals(vehicle: { type: VehicleType; powertrain?: string }): ServiceInterval[] {
    const { type, powertrain } = vehicle;
    const isElectric = powertrain === "electric";

    switch (type) {
        case "auto":
        case "motorcycle":
            return isElectric ? DEFAULT_CAR_ELECTRIC_INTERVALS : DEFAULT_CAR_INTERVALS;
        case "mower":
            return isElectric ? DEFAULT_MOWER_ELECTRIC_INTERVALS : DEFAULT_MOWER_INTERVALS;
        case "snowblower":
            return isElectric ? DEFAULT_SNOWBLOWER_ELECTRIC_INTERVALS : DEFAULT_SNOWBLOWER_INTERVALS;
        case "atv":
        case "utv":
            return isElectric ? DEFAULT_ATV_ELECTRIC_INTERVALS : DEFAULT_ATV_INTERVALS;
        case "boat":
            return isElectric ? DEFAULT_BOAT_ELECTRIC_INTERVALS : DEFAULT_BOAT_INTERVALS;
        default:
            return [];
    }
}

const statusRank = { overdue: 0, due_soon: 1, upcoming: 2 };

function mergeAndSort(perVehicle: Record<string, ActionItem[]>): ActionItem[] {
    const all: ActionItem[] = [];
    for (const items of Object.values(perVehicle)) {
        all.push(...items);
    }
    return all.sort((a, b) => {
        if (statusRank[a.status] !== statusRank[b.status]) {
            return statusRank[a.status] - statusRank[b.status];
        }
        const aDays = a.remainingDays ?? 9999;
        const bDays = b.remainingDays ?? 9999;
        return aDays - bDays;
    });
}

export function useActionableItems(vehicles: Vehicle[]) {
    const { user } = useAuth();
    const [items, setItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Per-vehicle item cache — updated individually so one vehicle's log
    // change doesn't recalculate every other vehicle.
    const perVehicleRef = useRef<Record<string, ActionItem[]>>({});
    const vehicleCount = vehicles.length;

    useEffect(() => {
        if (!user || vehicleCount === 0) {
            const timer = setTimeout(() => {
                perVehicleRef.current = {};
                setItems([]);
                setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const vehicleLogs: Record<string, MaintenanceLog[]> = {};
        const unsubscribes: (() => void)[] = [];
        let receivedCount = 0;

        vehicles.forEach((vehicle) => {
            if (!vehicle.id) return;

            const unsub = subscribeToMaintenanceLogs(
                user.uid,
                vehicle.id,
                (logs) => {
                    vehicleLogs[vehicle.id!] = logs;

                    // Recalculate only this vehicle's items
                    const vehicleWithDefaults = {
                        ...vehicle,
                        serviceIntervals: (vehicle.serviceIntervals && vehicle.serviceIntervals.length > 0)
                            ? vehicle.serviceIntervals
                            : getDefaultIntervals(vehicle),
                    };
                    perVehicleRef.current[vehicle.id!] = calculateActionItems(vehicleWithDefaults, logs);

                    receivedCount++;
                    if (receivedCount >= vehicleCount) {
                        setLoading(false);
                    }
                    setItems(mergeAndSort(perVehicleRef.current));
                },
                (error) => {
                    console.error(`Error fetching logs for ${vehicle.name}:`, error);
                }
            );
            unsubscribes.push(unsub);
        });

        return () => {
            unsubscribes.forEach((unsub) => unsub());
        };
    // vehicleCount (primitive) intentionally replaces vehicles (object reference) to avoid
    // re-subscribing on every Firestore update that doesn't change the vehicle list size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, vehicleCount]);

    return { items, loading };
}
