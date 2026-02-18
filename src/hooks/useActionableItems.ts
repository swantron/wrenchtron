import { useEffect, useState } from "react";
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
        notes: "Regular oil and filter change",
    },
    {
        id: "default-tire",
        name: "Tire Rotation",
        type: "mileage",
        mileageInterval: 6000,
        notes: "Rotate tires to ensure even wear",
    },
    {
        id: "default-air-filter",
        name: "Engine Air Filter",
        type: "mileage",
        mileageInterval: 30000,
        notes: "Replace engine air filter",
    },
];

const DEFAULT_MOWER_INTERVALS: ServiceInterval[] = [
    {
        id: "default-mower-oil",
        name: "Oil Change",
        type: "seasonal",
        season: "spring",
        notes: "Annual oil change before mowing season",
    },
    {
        id: "default-mower-blades",
        name: "Blade Sharpening",
        type: "seasonal",
        season: "spring",
        notes: "Sharpen or replace blades",
    },
    {
        id: "default-mower-winter",
        name: "Winterize",
        type: "seasonal",
        season: "fall",
        notes: "Stabilize fuel, remove battery",
    },
];

const DEFAULT_SNOWBLOWER_INTERVALS: ServiceInterval[] = [
    {
        id: "default-snow-oil",
        name: "Oil Change",
        type: "seasonal",
        season: "fall",
        notes: "Annual oil change before winter",
    },
    {
        id: "default-snow-auger",
        name: "Auger/Belt Check",
        type: "seasonal",
        season: "fall",
        notes: "Check auger, belts, and shear pins",
    },
    {
        id: "default-snow-summer",
        name: "Summerize",
        type: "seasonal",
        season: "spring",
        notes: "Stabilize fuel, drain carb",
    },
];

function getDefaultIntervals(type: VehicleType): ServiceInterval[] {
    switch (type) {
        case "mower":
            return DEFAULT_MOWER_INTERVALS;
        case "snowblower":
            return DEFAULT_SNOWBLOWER_INTERVALS;
        case "car":
        case "truck":
        case "suv":
        case "van":
        case "motorcycle":
            return DEFAULT_CAR_INTERVALS;
        default:
            return DEFAULT_CAR_INTERVALS;
    }
}

export function useActionableItems(vehicles: Vehicle[]) {
    const { user } = useAuth();
    const [items, setItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || vehicles.length === 0) {
            const timer = setTimeout(() => {
                setItems([]);
                setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        const vehicleLogs: Record<string, MaintenanceLog[]> = {};
        const unsubscribes: (() => void)[] = [];

        // Helper to re-calculate everything when any log changes
        const recalculateAll = () => {
            let allItems: ActionItem[] = [];
            vehicles.forEach(vehicle => {
                const logs = vehicleLogs[vehicle.id!] || [];
                // Inject defaults if no intervals defined
                const vehicleWithDefaults = {
                    ...vehicle,
                    serviceIntervals: (vehicle.serviceIntervals && vehicle.serviceIntervals.length > 0)
                        ? vehicle.serviceIntervals
                        : getDefaultIntervals(vehicle.type)
                };
                const vehicleItems = calculateActionItems(vehicleWithDefaults, logs);
                allItems = [...allItems, ...vehicleItems];
            });

            // Global Sort
            const statusRank = { overdue: 0, due_soon: 1, upcoming: 2 };
            allItems.sort((a, b) => {
                if (statusRank[a.status] !== statusRank[b.status]) {
                    return statusRank[a.status] - statusRank[b.status];
                }
                const aDays = a.remainingDays ?? 9999;
                const bDays = b.remainingDays ?? 9999;
                return aDays - bDays;
            });

            setItems(allItems);
            setLoading(false);
        };

        vehicles.forEach((vehicle) => {
            if (!vehicle.id) return;

            const unsub = subscribeToMaintenanceLogs(
                user.uid,
                vehicle.id,
                (logs) => {
                    vehicleLogs[vehicle.id!] = logs;
                    recalculateAll();
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
    }, [user, vehicles]); // Re-run if vehicle list changes (e.g. add/remove vehicle)

    return { items, loading };
}
