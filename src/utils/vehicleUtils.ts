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
    other:      { tracksMileage: true,  isRoadVehicle: false },
    mower:      { tracksMileage: false, isRoadVehicle: false },
    snowblower: { tracksMileage: false, isRoadVehicle: false },
};

// Determines if a vehicle type typically tracks mileage
export function tracksMileage(type: VehicleType): boolean {
    return VEHICLE_CAPABILITIES[type]?.tracksMileage ?? false;
}

// Determines if a vehicle type has road-vehicle specific fields
// (engine, transmission, drivetrain, VIN, license plate, recalls)
export function isRoadVehicle(type: VehicleType): boolean {
    return VEHICLE_CAPABILITIES[type]?.isRoadVehicle ?? false;
}

// Helper to format mileage display (returns null if shouldn't be shown)
export function formatMileage(mileage: number | undefined, type: VehicleType): string | null {
    if (!mileage || !tracksMileage(type)) {
        return null;
    }

    // Treat very high mileage (>500k) as placeholder
    if (mileage > MAX_DISPLAY_MILEAGE) {
        return null;
    }

    return mileage.toLocaleString();
}
