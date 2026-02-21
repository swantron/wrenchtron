import { Timestamp } from "firebase/firestore";
import type { MaintenanceType } from "@/types/maintenance";

export type VehicleType =
  | "car"
  | "truck"
  | "motorcycle"
  | "atv"
  | "suv"
  | "van"
  | "mower"
  | "snowblower"
  | "boat"
  | "other";

export interface Vehicle {
  id?: string;
  name: string;
  type: VehicleType;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  vin?: string;
  licensePlate?: string;
  currentMileage: number;
  estimatedAnnualMileage?: number; // For predictive maintenance
  photoPath?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  serviceIntervals?: ServiceInterval[];
  resolvedRecalls?: string[]; // NHTSA campaign numbers
}

export type IntervalType = "mileage" | "time" | "seasonal" | "composite" | "month";

export interface ServiceInterval {
  id: string;
  name: string;
  type: IntervalType;
  targetMaintenanceType?: MaintenanceType; // Used to match against log entries

  // Triggers
  mileageInterval?: number;
  timeIntervalMonths?: number;
  season?: "spring" | "fall" | "summer" | "winter";

  // Notes
  notes?: string;

  // Refinement fields
  isOptional?: boolean;
  isComponentBased?: boolean;
  componentInstallationType?: MaintenanceType;
  totalLifeMileage?: number;
  specificMonth?: number; // 0-11 (Jan-Dec)
}
