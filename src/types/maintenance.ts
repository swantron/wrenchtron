import { Timestamp } from "firebase/firestore";

export type MaintenanceType =
  | "oil_change"
  | "tire_rotation"
  | "tire_replacement"
  | "brake_pads"
  | "brake_rotors"
  | "air_filter"
  | "cabin_filter"
  | "spark_plugs"
  | "transmission_fluid"
  | "coolant_flush"
  | "battery"
  | "wiper_blades"
  | "alignment"
  | "inspection"
  | "other";

export interface OilChangeDetails {
  oilType?: string;
  oilWeight?: string;
  oilBrand?: string;
  oilQuantity?: number;
  filterBrand?: string;
  filterPartNumber?: string;
}

export interface TireDetails {
  positions?: string[];
  brand?: string;
  model?: string;
  size?: string;
}

export interface BrakeDetails {
  position?: string;
  brand?: string;
  padType?: string;
  rotorReplaced?: boolean;
}

export interface GenericDetails {
  [key: string]: string | number | boolean | undefined;
}

export type MaintenanceDetails =
  | OilChangeDetails
  | TireDetails
  | BrakeDetails
  | GenericDetails;

export interface MaintenanceLog {
  id?: string;
  maintenanceType: MaintenanceType;
  date: Timestamp;
  mileage: number;
  cost: number; // in cents
  shop?: string;
  notes?: string;
  receiptPaths: string[];
  details: MaintenanceDetails;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
