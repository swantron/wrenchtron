import { Vehicle } from "../types/firestore";
import { MaintenanceLog } from "../types/maintenance";

export interface ActionItem {
    id: string;
    vehicleId: string;
    vehicleName: string;
    serviceName: string;
    status: "overdue" | "due_soon" | "upcoming";
    reason: string;
    dueDate?: Date;
    dueMileage?: number;
    remainingMiles?: number;
    remainingDays?: number;
    // Projection details
    isProjected?: boolean;
    projectedDate?: Date;
    projectedMileage?: number;
}

// Default annual mileage constant (unused)

export function calculateProjectedMileage(vehicle: Vehicle): number {
    if (!vehicle.estimatedAnnualMileage || vehicle.estimatedAnnualMileage <= 0) {
        return vehicle.currentMileage;
    }

    const lastUpdateDate = vehicle.updatedAt.toDate();
    const now = new Date();
    const daysSinceUpdate = Math.max(0, (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));

    const dailyRate = vehicle.estimatedAnnualMileage / 365;
    const projectedGrowth = Math.floor(dailyRate * daysSinceUpdate);

    return vehicle.currentMileage + projectedGrowth;
}

export function calculateActionItems(
    vehicle: Vehicle,
    logs: MaintenanceLog[]
): ActionItem[] {
    if (!vehicle.serviceIntervals || vehicle.serviceIntervals.length === 0) {
        return [];
    }

    const items: ActionItem[] = [];

    for (const interval of vehicle.serviceIntervals) {
        // Find the latest log that matches this service interval
        const relevantLogs = logs.filter(log => {
            if (interval.targetMaintenanceType) {
                return log.maintenanceType === interval.targetMaintenanceType;
            }
            // Fall back to name-based matching
            const normalizedName = interval.name.toLowerCase();
            const type = log.maintenanceType.replace(/_/g, " ");
            return type === normalizedName || (log.notes && log.notes.toLowerCase().includes(normalizedName));
        }).sort((a, b) => b.date.toMillis() - a.date.toMillis());

        const lastLog = relevantLogs[0];
        const lastDate = lastLog ? lastLog.date.toDate() : vehicle.createdAt.toDate();
        const lastMileage = lastLog ? lastLog.mileage : 0;

        let status: ActionItem["status"] = "upcoming";
        let reason = "";
        let dueDate: Date | undefined;
        let dueMileage: number | undefined;
        let remainingMiles: number | undefined;
        let remainingDays: number | undefined;
        let projectedDate: Date | undefined;
        let isProjected = false;

        // Current status (Projected or Actual)
        const currentMileage = calculateProjectedMileage(vehicle);
        if (currentMileage > vehicle.currentMileage) {
            isProjected = true;
        }

        // --- Mileage Logic ---
        if (interval.mileageInterval) {
            // When is it due?
            dueMileage = lastMileage + interval.mileageInterval;
            remainingMiles = dueMileage - currentMileage;

            // Estimate DATE it will be due based on daily rate
            if (vehicle.estimatedAnnualMileage && vehicle.estimatedAnnualMileage > 0) {
                const dailyRate = vehicle.estimatedAnnualMileage / 365;
                // Days until we hit the due mileage
                // Note: remainingMiles might be negative (overdue)
                const now = new Date();
                const daysUntilDue = remainingMiles / dailyRate;

                // Cap the projected date to not be in the distant past if no logs exist
                const projectedTime = now.getTime() + (daysUntilDue * 24 * 60 * 60 * 1000);
                const minDate = lastLog ? lastDate : now;

                projectedDate = new Date(Math.max(minDate.getTime(), projectedTime));
            }
        }

        // --- Time Logic ---
        if (interval.timeIntervalMonths) {
            dueDate = new Date(lastDate);
            dueDate.setMonth(dueDate.getMonth() + interval.timeIntervalMonths);

            const now = new Date();
            const diffTime = dueDate.getTime() - now.getTime();
            remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // --- Seasonal Logic ---
        if (interval.season) {
            const now = new Date();
            const month = now.getMonth(); // 0-11

            // Season definitions ( Northern Hemisphere )
            // Spring: March (2) - May (4)
            // Summer: June (5) - Aug (7)
            // Fall: Sept (8) - Nov (10)
            // Winter: Dec (11) - Feb (1)

            let isSeason = false;
            if (interval.season === "spring" && month >= 2 && month <= 4) isSeason = true;
            if (interval.season === "summer" && month >= 5 && month <= 7) isSeason = true;
            if (interval.season === "fall" && month >= 8 && month <= 10) isSeason = true;
            if (interval.season === "winter" && (month === 11 || month <= 1)) isSeason = true;

            if (isSeason) {
                // Check if done in the last 6 months (to avoid nagging if already done this season)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                if (lastDate < sixMonthsAgo) {
                    status = "due_soon";
                    reason = `It is ${interval.season}, time for ${interval.name}.`;
                    // Force add this item
                    items.push({
                        id: `${vehicle.id}-${interval.id}`,
                        vehicleId: vehicle.id || "",
                        vehicleName: vehicle.name,
                        serviceName: interval.name,
                        status,
                        reason,
                        dueMileage,
                        dueDate,
                        remainingMiles,
                        remainingDays
                    });
                    continue; // Move to next interval
                }
            }
        }

        // --- Result Calculation ---
        // If both mileage and time are set, take the one that is SOONER (or Overdue)

        const isMileageOverdue = remainingMiles !== undefined && remainingMiles < 0;
        const isTimeOverdue = remainingDays !== undefined && remainingDays < 0;

        const isMileageDueSoon = remainingMiles !== undefined && remainingMiles < 500;
        const isTimeDueSoon = remainingDays !== undefined && remainingDays < 30;

        if (isMileageOverdue || isTimeOverdue) {
            status = "overdue";
            if (isMileageOverdue && isTimeOverdue) {
                reason = `Overdue by ${Math.abs(remainingMiles!)} miles and ${Math.abs(remainingDays!)} days`;
            } else if (isMileageOverdue) {
                reason = `Overdue by ${Math.abs(remainingMiles!)} miles`;
            } else {
                reason = `Overdue by ${Math.abs(remainingDays!)} days`;
            }
        } else if (isMileageDueSoon || isTimeDueSoon) {
            status = "due_soon";
            if (isMileageDueSoon) {
                reason = `Due in ${remainingMiles} miles`;
            } else {
                reason = `Due in ${remainingDays} days`;
            }
        } else {
            // Upcoming
            status = "upcoming";
            if (remainingMiles !== undefined && remainingDays !== undefined) {
                reason = `Due in ${remainingMiles} miles or ${remainingDays} days`;
            } else if (remainingMiles !== undefined) {
                reason = `Due in ${remainingMiles} miles`;
            } else if (remainingDays !== undefined) {
                reason = `Due in ${remainingDays} days`;
            }
        }

        // Only add if it's not "far out" or if we want to show everything. 
        // Let's show everything for now but sorting will handle priority.
        // If status is upcoming but very far away (e.g. > 1000 miles or > 60 days), maybe reduce priority UI-wise.
        // For now, add everything to the list.

        items.push({
            id: `${vehicle.id}-${interval.id}`,
            vehicleId: vehicle.id || "",
            vehicleName: vehicle.name,
            serviceName: interval.name,
            status,
            reason,
            dueMileage,
            dueDate,
            remainingMiles,
            remainingDays,
            isProjected,
            projectedDate,
            projectedMileage: isProjected ? currentMileage : undefined
        });
    }

    // Sort by urgency
    // Overdue > Due Soon > Upcoming
    // Within same status, sort by "percentage remaining" or just simple days/miles?
    // Simple sort: usage status rank.

    const statusRank = { overdue: 0, due_soon: 1, upcoming: 2 };

    return items.sort((a, b) => {
        if (statusRank[a.status] !== statusRank[b.status]) {
            return statusRank[a.status] - statusRank[b.status];
        }
        // If same status, maybe sort by remaining days if available?
        const aDays = a.remainingDays ?? 9999;
        const bDays = b.remainingDays ?? 9999;
        return aDays - bDays;
    });
}
