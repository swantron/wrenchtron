import { Vehicle } from "../types/firestore";
import { MaintenanceLog, MaintenanceDetails } from "../types/maintenance";

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
    // Total interval lengths (for progress bar calculation)
    intervalMiles?: number;
    intervalDays?: number;
    // Projection details
    isProjected?: boolean;
    projectedDate?: Date;
    projectedMileage?: number;
    isOptional?: boolean;
    lastLog?: {
        date: Date;
        mileage: number;
        shop?: string;
        details: MaintenanceDetails;
    };
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

        // --- Component Life Logic (e.g. Tire Replacement) ---
        let baseMileage = lastMileage;
        let baseDate = lastDate;

        if (interval.isComponentBased && interval.componentInstallationType) {
            // Find MOST RECENT installation log
            const installationLog = logs
                .filter(log => log.maintenanceType === interval.componentInstallationType)
                .sort((a, b) => b.date.toMillis() - a.date.toMillis())[0];

            if (installationLog) {
                baseMileage = installationLog.mileage;
                baseDate = installationLog.date.toDate();
            }
        }

        // --- Result Calculation ---
        let isMileageOverdue = false;
        let isTimeOverdue = false;
        let isMileageDueSoon = false;
        let isTimeDueSoon = false;

        const usesMileage = interval.type === "mileage" || interval.type === "composite";
        const usesTime = interval.type === "time" || interval.type === "composite";

        // Mileage Trigger
        if (usesMileage && interval.mileageInterval) {
            dueMileage = lastMileage + interval.mileageInterval;
            remainingMiles = dueMileage - currentMileage;
            isMileageOverdue = remainingMiles < 0;
            isMileageDueSoon = remainingMiles < 500;

            // Projection
            if (vehicle.estimatedAnnualMileage && vehicle.estimatedAnnualMileage > 0) {
                const dailyRate = vehicle.estimatedAnnualMileage / 365;
                const now = new Date();
                const daysUntilDue = remainingMiles / dailyRate;
                const projectedTime = now.getTime() + (daysUntilDue * 24 * 60 * 60 * 1000);
                const minDate = lastLog ? lastDate : now;
                projectedDate = new Date(Math.max(minDate.getTime(), projectedTime));
            }
        }

        // Total Life Mileage (Component-based)
        if (usesMileage && interval.totalLifeMileage) {
            const lifeDueMileage = baseMileage + interval.totalLifeMileage;
            const lifeRemainingMiles = lifeDueMileage - currentMileage;
            if (lifeRemainingMiles < 0) {
                isMileageOverdue = true;
                remainingMiles = Math.min(remainingMiles ?? Infinity, lifeRemainingMiles);
            } else if (lifeRemainingMiles < 1000) {
                isMileageDueSoon = true;
                remainingMiles = Math.min(remainingMiles ?? Infinity, lifeRemainingMiles);
            }
        }

        // Time Trigger
        if (usesTime && interval.timeIntervalMonths) {
            dueDate = new Date(baseDate);
            dueDate.setMonth(dueDate.getMonth() + interval.timeIntervalMonths);
            const now = new Date();
            const diffTime = dueDate.getTime() - now.getTime();
            remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isTimeOverdue = remainingDays < 0;
            isTimeDueSoon = remainingDays < 30;
        }

        // --- Specific Month Logic ---
        if (interval.type === "month" && interval.specificMonth !== undefined) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const targetMonth = interval.specificMonth; // 0-11
            const targetDate = new Date(currentYear, targetMonth, 1); // Set to the 1st of the target month

            // If the month has passed this year, move to next year
            if (now.getMonth() > targetMonth) {
                targetDate.setFullYear(currentYear + 1);
            }

            dueDate = targetDate;
            const diffTime = targetDate.getTime() - now.getTime();
            remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            if (now.getMonth() === targetMonth) {
                isTimeDueSoon = true;
                remainingDays = 0;
            } else if (remainingDays < 30) {
                isTimeDueSoon = true;
            }
        }

        // --- Seasonal Logic ---
        if (interval.season) {
            const now = new Date();
            const month = now.getMonth(); // 0-11

            // Season definitions ( Northern Hemisphere )
            let isSeason = false;
            if (interval.season === "spring" && month >= 2 && month <= 4) isSeason = true;
            if (interval.season === "summer" && month >= 5 && month <= 7) isSeason = true;
            if (interval.season === "fall" && month >= 8 && month <= 10) isSeason = true;
            if (interval.season === "winter" && (month === 11 || month <= 1)) isSeason = true;

            const optionalPrefix = interval.isOptional ? "(Optional) " : "";

            if (isSeason) {
                // Check if done in the last 6 months
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                if (lastDate < sixMonthsAgo) {
                    status = "due_soon";
                    reason = `${optionalPrefix}It is ${interval.season}, time for ${interval.name}.`;
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
                        intervalMiles: interval.mileageInterval ?? interval.totalLifeMileage,
                        intervalDays: interval.timeIntervalMonths ? interval.timeIntervalMonths * 30 : undefined,
                        isOptional: interval.isOptional,
                        lastLog: lastLog ? {
                            date: lastLog.date.toDate(),
                            mileage: lastLog.mileage,
                            shop: lastLog.shop,
                            details: lastLog.details,
                        } : undefined,
                    });
                    continue; // Move to next interval
                }
            }
        }

        const optionalPrefix = interval.isOptional ? "(Optional) " : "";

        if (isMileageOverdue || isTimeOverdue) {
            status = "overdue";
            if (isMileageOverdue && isTimeOverdue) {
                reason = `${optionalPrefix}Overdue by ${Math.abs(remainingMiles!)} miles and ${Math.abs(remainingDays!)} days`;
            } else if (isMileageOverdue) {
                reason = `${optionalPrefix}Overdue by ${Math.abs(remainingMiles!)} miles`;
            } else {
                reason = `${optionalPrefix}Overdue by ${Math.abs(remainingDays!)} days`;
            }
        } else if (isMileageDueSoon || isTimeDueSoon) {
            status = "due_soon";
            if (isMileageDueSoon) {
                reason = `${optionalPrefix}Due in ${remainingMiles} miles`;
            } else {
                reason = `${optionalPrefix}Due in ${remainingDays} days`;
            }
        } else {
            status = "upcoming";
            if (remainingMiles !== undefined && remainingDays !== undefined) {
                reason = `${optionalPrefix}Due in ${remainingMiles} miles or ${remainingDays} days`;
            } else if (remainingMiles !== undefined) {
                reason = `${optionalPrefix}Due in ${remainingMiles} miles`;
            } else if (remainingDays !== undefined) {
                reason = `${optionalPrefix}Due in ${remainingDays} days`;
            }
        }

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
            intervalMiles: interval.mileageInterval ?? interval.totalLifeMileage,
            intervalDays: interval.timeIntervalMonths ? interval.timeIntervalMonths * 30 : undefined,
            isProjected,
            projectedDate,
            projectedMileage: isProjected ? currentMileage : undefined,
            isOptional: interval.isOptional,
            lastLog: lastLog ? {
                date: lastLog.date.toDate(),
                mileage: lastLog.mileage,
                shop: lastLog.shop,
                details: lastLog.details,
            } : undefined,
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
