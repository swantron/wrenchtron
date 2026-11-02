import type { Powertrain, ServiceInterval } from "@/types/firestore";

// Fleet-wide service schedules. Each imported van gets a copy of its schedule's
// intervals, so the maintenance engine works on it unchanged (see FLEET.md).
// The demo fleet uses the same ones.

export interface FleetSchedulePreset {
  id: string;
  name: string;
  intervals: ServiceInterval[];
}

export const GAS_SEVERE: FleetSchedulePreset = {
  id: "gas-severe",
  name: "Gas van — severe duty",
  intervals: [
    {
      id: "fleet-oil",
      name: "Oil Change",
      type: "composite",
      mileageInterval: 7500,
      timeIntervalMonths: 6,
      targetMaintenanceType: "oil_change",
      notes: "Severe-duty schedule (stop-and-go delivery)",
    },
    {
      id: "fleet-tire",
      name: "Tire Rotation",
      type: "mileage",
      mileageInterval: 7500,
      targetMaintenanceType: "tire_rotation",
    },
    {
      id: "fleet-inspection",
      name: "Safety Inspection",
      type: "time",
      timeIntervalMonths: 6,
      targetMaintenanceType: "inspection",
      notes: "Brakes, lights, tires, wipers, doors",
    },
  ],
};

export const ELECTRIC_VAN: FleetSchedulePreset = {
  id: "electric",
  name: "Electric van",
  intervals: [
    {
      id: "fleet-ev-tire",
      name: "Tire Rotation",
      type: "mileage",
      mileageInterval: 7500,
      targetMaintenanceType: "tire_rotation",
    },
    {
      id: "fleet-ev-inspection",
      name: "Safety Inspection",
      type: "time",
      timeIntervalMonths: 6,
      targetMaintenanceType: "inspection",
      notes: "Brakes, lights, tires, wipers, doors",
    },
    {
      id: "fleet-ev-cabin",
      name: "Cabin Air Filter",
      type: "time",
      timeIntervalMonths: 12,
      targetMaintenanceType: "cabin_filter",
    },
  ],
};

export const FLEET_SCHEDULE_PRESETS = [GAS_SEVERE, ELECTRIC_VAN];

export function scheduleFor(powertrain: Powertrain | undefined): FleetSchedulePreset {
  return powertrain === "electric" ? ELECTRIC_VAN : GAS_SEVERE;
}
