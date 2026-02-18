import { useEffect, useState } from "react";
import { Vehicle } from "@/types/firestore";
import { MaintenanceLog } from "@/types/maintenance";
import { subscribeToMaintenanceLogs } from "@/lib/firebase/firestore";
import { ActionItem, calculateActionItems } from "@/utils/maintenance";
import { useAuth } from "./useAuth";

import { ServiceInterval } from "@/types/firestore";

const DEFAULT_SERVICE_INTERVALS: ServiceInterval[] = [
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
        id: "default-winter",
        name: "Winterize",
        type: "seasonal",
        season: "fall", // Nov
        notes: "Check antifreeze, battery, tires for winter",
    },
    {
        id: "default-summer",
        name: "Summer Prep",
        type: "seasonal",
        season: "spring", // May
        notes: "Check A/C, coolant, summer tires",
    },
];

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
                        : DEFAULT_SERVICE_INTERVALS
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
