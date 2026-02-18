import { Timestamp } from "firebase/firestore";

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
  photoPath?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  serviceIntervals?: ServiceInterval[];
}

export type IntervalType = "mileage" | "time" | "seasonal" | "composite";

export interface ServiceInterval {
  id: string;
  name: string;
  type: IntervalType;

  // Triggers
  mileageInterval?: number;
  timeIntervalMonths?: number;
  season?: "spring" | "fall" | "summer" | "winter";
  month?: number; // 1-12

  // Notes
  notes?: string;
}
