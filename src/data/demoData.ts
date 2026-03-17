import type { VehicleType, Powertrain } from "@/types/firestore";

export interface DemoVehicle {
  id: string;
  name: string;
  type: VehicleType;
  powertrain?: Powertrain;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  currentMileage: number;
  estimatedAnnualMileage?: number;
  image: string;
}

export interface DemoLog {
  id: string;
  maintenanceType: string;
  date: string;
  mileage: number;
  cost: number;
  shop?: string;
  notes?: string;
  details: Record<string, string | number | boolean | undefined>;
}

export const demoVehicles: DemoVehicle[] = [
  {
    id: "f150",
    name: "The Tremor",
    type: "auto",
    powertrain: "gas",
    year: 2023,
    make: "Ford",
    model: "F-150",
    trim: "Tremor",
    engine: "3.5L V6 EcoBoost",
    transmission: "10-Speed Auto",
    drivetrain: "4WD w/ Hi-Lock",
    currentMileage: 12450,
    estimatedAnnualMileage: 15000,
    image: "/images/demo/f150_hero.png",
  },
  {
    id: "yukon",
    name: "The Yukon",
    type: "auto",
    powertrain: "gas",
    year: 1996,
    make: "GMC",
    model: "Yukon",
    trim: "SLE 2-Door",
    engine: "5.7L V8 (350)",
    transmission: "4L60-E 4-Speed Auto",
    drivetrain: "4WD",
    currentMileage: 187432,
    estimatedAnnualMileage: 5000,
    image: "/images/demo/yukon.jpg",
  },
  {
    id: "rzr",
    name: "The RZR",
    type: "atv",
    powertrain: "gas",
    year: 2017,
    make: "Polaris",
    model: "RZR 900",
    trim: "4-Seater",
    engine: "875cc ProStar Twin",
    transmission: "Automatic PVT",
    drivetrain: "AWD / 2WD",
    currentMileage: 4820,
    estimatedAnnualMileage: 1000,
    image: "/images/demo/rzr.jpg",
  },
  {
    id: "mower",
    name: "The Lawn King",
    type: "mower",
    powertrain: "gas",
    year: 2021,
    make: "John Deere",
    model: "X350",
    trim: '42" Deck',
    engine: "18.5 HP V-Twin",
    transmission: "Hydrostatic",
    drivetrain: "RWD",
    currentMileage: 999999,
    image: "/images/demo/mower.jpg",
  },
  {
    id: "mower-e",
    name: "The Quiet Cut",
    type: "mower",
    powertrain: "electric",
    year: 2024,
    make: "Ego",
    model: "LM2167",
    trim: '21" Deck',
    currentMileage: 999999,
    image: "/images/demo/mower.jpg",
  },
  {
    id: "snowblower",
    name: "The Blizzard Buster",
    type: "snowblower",
    powertrain: "gas",
    year: 2019,
    make: "Ariens",
    model: "Deluxe 28",
    trim: "SHO",
    engine: "306cc Ariens AX",
    transmission: "Auto-Turn",
    drivetrain: "Track Drive",
    currentMileage: 999999,
    image: "/images/demo/snowblower.jpg",
  },
];

export const demoLogs: Record<string, DemoLog[]> = {
  f150: [
    {
      id: "f1",
      maintenanceType: "oil_change",
      date: "2026-01-15",
      mileage: 10000,
      cost: 8995,
      shop: "Ford Dealership",
      notes: "First service, full synthetic.",
      details: {
        oilType: "full_synthetic",
        oilWeight: "5W-30",
        oilBrand: "Motorcraft",
      },
    },
    {
      id: "f2",
      maintenanceType: "inspection",
      date: "2026-01-15",
      mileage: 10000,
      cost: 0,
      shop: "Ford Dealership",
      notes: "Multi-point inspection, all green.",
      details: {},
    },
  ],
  yukon: [
    {
      id: "y1",
      maintenanceType: "oil_change",
      date: "2025-12-14",
      mileage: 187432,
      cost: 3200,
      shop: "Home / Garage",
      notes: "Used ramps. Filter was stuck, needed strap wrench.",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "Valvoline",
        oilQuantity: 5,
        filterBrand: "Fram",
        filterPartNumber: "PH3506",
      },
    },
    {
      id: "y5",
      maintenanceType: "brake_pads",
      date: "2025-07-20",
      mileage: 183100,
      cost: 8500,
      shop: "Home / Garage",
      notes: "Front only. Rotors still had plenty of meat.",
      details: {
        position: "Front",
        brand: "Wagner ThermoQuiet",
        padType: "Semi-metallic",
      },
    },
  ],
  rzr: [
    {
      id: "r1",
      maintenanceType: "oil_change",
      date: "2025-10-20",
      mileage: 4800,
      cost: 4500,
      shop: "Home / Garage",
      notes: "Post-season change. Engine oil and filter.",
      details: {
        oilType: "synthetic",
        oilWeight: "5W-50",
        oilBrand: "Polaris PS-4",
        oilQuantity: 2.5,
        filterBrand: "Polaris",
        filterPartNumber: "2521421",
      },
    },
  ],
  mower: [
    {
      id: "m1",
      maintenanceType: "oil_change",
      date: "2025-09-15",
      mileage: 0,
      cost: 2500,
      shop: "Home / Garage",
      notes: "End of season oil change. Blade sharpened.",
      details: {
        oilType: "conventional",
        oilWeight: "10W-30",
        oilBrand: "John Deere",
        oilQuantity: 1.5,
      },
    },
    {
      id: "m2",
      maintenanceType: "air_filter",
      date: "2025-04-10",
      mileage: 0,
      cost: 1200,
      shop: "Home / Garage",
      notes: "Pre-season maintenance. New air filter and spark plug.",
      details: {
        filterBrand: "John Deere",
        filterPartNumber: "GY21057",
      },
    },
  ],
  "mower-e": [
    {
      id: "me1",
      maintenanceType: "blade_sharpening",
      date: "2025-04-12",
      mileage: 0,
      cost: 0,
      shop: "Home / Garage",
      notes: "Sharpened blades before first mow of season.",
      details: {},
    },
    {
      id: "me2",
      maintenanceType: "battery",
      date: "2025-01-15",
      mileage: 0,
      cost: 0,
      shop: "Home / Garage",
      notes: "Battery health check. All cells balanced.",
      details: {},
    },
  ],
  snowblower: [
    {
      id: "s1",
      maintenanceType: "oil_change",
      date: "2025-11-01",
      mileage: 0,
      cost: 1800,
      shop: "Home / Garage",
      notes: "Pre-winter service. Fresh oil and spark plug.",
      details: {
        oilType: "synthetic",
        oilWeight: "5W-30",
        oilBrand: "Ariens",
        oilQuantity: 0.6,
      },
    },
    {
      id: "s2",
      maintenanceType: "inspection",
      date: "2025-03-15",
      mileage: 0,
      cost: 0,
      shop: "Home / Garage",
      notes: "Post-season inspection. Greased auger bearings.",
      details: {},
    },
  ],
};
