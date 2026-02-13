import { VehicleType } from '@/types/firestore';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
    car: 'Car',
    truck: 'Truck',
    suv: 'SUV',
    van: 'Van',
    motorcycle: 'Motorcycle',
    mower: 'Mower',
    snowblower: 'Snowblower',
    boat: 'Boat',
    atv: 'ATV/UTV',
    other: 'Other',
};

// Determines if a vehicle type typically tracks mileage
export function tracksMileage(type: VehicleType): boolean {
    const nonMileageTypes: VehicleType[] = ['mower', 'snowblower'];
    return !nonMileageTypes.includes(type);
}

// Helper to format mileage display (returns null if shouldn't be shown)
export function formatMileage(mileage: number | undefined, type: VehicleType): string | null {
    if (!mileage || !tracksMileage(type)) {
        return null;
    }

    // Treat very high mileage (>500k) as placeholder
    if (mileage > 500000) {
        return null;
    }

    return mileage.toLocaleString();
}
