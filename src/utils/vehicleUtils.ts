import { VehicleType } from '@/types/firestore';

export const MAX_DISPLAY_MILEAGE = 500_000;

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
    auto: 'Auto',
    motorcycle: 'Motorcycle',
    atv: 'ATV',
    utv: 'UTV',
    mower: 'Mower',
    snowblower: 'Snowblower',
    boat: 'Boat',
    other: 'Other',
};

export const VEHICLE_CAPABILITIES: Record<VehicleType, { tracksMileage: boolean; isRoadVehicle: boolean }> = {
    auto:       { tracksMileage: true,  isRoadVehicle: true  },
    motorcycle: { tracksMileage: true,  isRoadVehicle: true  },
    atv:        { tracksMileage: true,  isRoadVehicle: false },
    utv:        { tracksMileage: true,  isRoadVehicle: false },
    boat:       { tracksMileage: true,  isRoadVehicle: false },
    other:      { tracksMileage: false, isRoadVehicle: false },
    mower:      { tracksMileage: false, isRoadVehicle: false },
    snowblower: { tracksMileage: false, isRoadVehicle: false },
};

// Maps legacy Firestore type values to their modern equivalents.
// "truck", "car", "suv", "van" predate the unified "auto" type.
const LEGACY_TYPE_MAP: Record<string, VehicleType> = {
    truck: 'auto',
    car:   'auto',
    suv:   'auto',
    van:   'auto',
};

export function normalizeVehicleType(type: string): VehicleType {
    if (type in LEGACY_TYPE_MAP) return LEGACY_TYPE_MAP[type];
    if (type in VEHICLE_CAPABILITIES) return type as VehicleType;
    return 'auto';
}

export function getVehicleTypeLabel(type: string): string {
    return VEHICLE_TYPE_LABELS[normalizeVehicleType(type)];
}

// Determines if a vehicle type typically tracks mileage
export function tracksMileage(type: string): boolean {
    return VEHICLE_CAPABILITIES[normalizeVehicleType(type)].tracksMileage;
}

// Determines if a vehicle type has road-vehicle specific fields
// (engine, transmission, drivetrain, VIN, license plate, recalls)
export function isRoadVehicle(type: string): boolean {
    return VEHICLE_CAPABILITIES[normalizeVehicleType(type)].isRoadVehicle;
}

// Helper to format mileage display (returns null if shouldn't be shown)
export function formatMileage(mileage: number | undefined, type: string): string | null {
    if (!mileage || !tracksMileage(type)) {
        return null;
    }

    // Treat very high mileage (>500k) as placeholder
    if (mileage > MAX_DISPLAY_MILEAGE) {
        return null;
    }

    return mileage.toLocaleString();
}

/** Format a date as "X days/months ago" for staleness indicators */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears === 1) return "1 year ago";
    return `${diffYears} years ago`;
}
