import type { Powertrain, ServiceInterval } from "@/types/firestore";
import type { MaintenanceType } from "@/types/maintenance";

// Synthetic delivery fleet for /demo/fleet. Generated deterministically and
// anchored to `now` so due/overdue statuses stay realistic whenever it's viewed.

export type FleetLocation = "Bozeman" | "Billings" | "Helena";
export type VanStatus = "in_service" | "at_shop" | "down";
export type PhotoKind = "odometer" | "part" | "invoice" | "tire" | "brake" | "damage";

export interface FleetPhoto {
  id: string;
  kind: PhotoKind;
  caption: string;
  /** Optional real image (e.g. /images/demo/fleet/xyz.jpg). Falls back to a rendered illustration. */
  src?: string;
  mileage?: number;
  brand?: string;
  partNumber?: string;
  tireSize?: string;
  treadDepth?: string;
  padMm?: number;
  shop?: string;
  total?: number; // cents
  lines?: string[];
  date?: Date;
}

export interface FleetLog {
  id: string;
  maintenanceType: MaintenanceType;
  date: Date;
  mileage: number;
  cost: number; // cents
  shop: string;
  tech: string;
  location: FleetLocation;
  notes?: string;
  details: Record<string, string | number | boolean | undefined>;
  photos: FleetPhoto[];
}

export interface FleetVan {
  id: string;
  unit: string;
  location: FleetLocation;
  status: VanStatus;
  statusNote?: string;
  year: number;
  make: string;
  model: string;
  powertrain: Powertrain;
  plate: string;
  currentMileage: number;
  estimatedAnnualMileage: number;
  /** When the van joined the fleet (start of its service history). */
  addedAt: Date;
  serviceIntervals: ServiceInterval[];
  logs: FleetLog[]; // newest first
}

interface ModelSpec {
  make: string;
  model: string;
  powertrain: Powertrain;
  tireSize: string;
  oilBrand?: string;
  oilWeight?: string;
  oilQuantity?: number;
  filterBrand?: string;
  filterPartNumber?: string;
}

const MODELS: ModelSpec[] = [
  {
    make: "Ford",
    model: "Transit 250 High Roof",
    powertrain: "gas",
    tireSize: "235/65R16C",
    oilBrand: "Motorcraft",
    oilWeight: "5W-30",
    oilQuantity: 6,
    filterBrand: "Motorcraft",
    filterPartNumber: "FL-500S",
  },
  {
    make: "Ram",
    model: "ProMaster 2500 High Roof",
    powertrain: "gas",
    tireSize: "225/75R16C",
    oilBrand: "Mopar",
    oilWeight: "0W-20",
    oilQuantity: 6,
    filterBrand: "Mopar",
    filterPartNumber: "68191349AA",
  },
  {
    make: "Rivian",
    model: "EDV 700",
    powertrain: "electric",
    tireSize: "245/75R16",
  },
];

interface SiteSpec {
  location: FleetLocation;
  firstUnit: number;
  count: number;
  historyDays: number;
  shop: string;
  inspectionShop: string;
  techs: string[];
}

// Bozeman is the established yard; Billings and Helena are newer sites.
const SITES: SiteSpec[] = [
  {
    location: "Bozeman",
    firstUnit: 101,
    count: 56,
    historyDays: 420,
    shop: "In-house — Bozeman yard",
    inspectionShop: "Partner shop — Bozeman",
    techs: ["Dan R.", "Luis M.", "Kayla S."],
  },
  {
    location: "Billings",
    firstUnit: 201,
    count: 16,
    historyDays: 160,
    shop: "Partner shop — Billings",
    inspectionShop: "Partner shop — Billings",
    techs: ["Tyler K. (partner)", "Marcus B. (partner)"],
  },
  {
    location: "Helena",
    firstUnit: 301,
    count: 8,
    historyDays: 110,
    shop: "Mobile mechanic — Helena",
    inspectionShop: "Mobile mechanic — Helena",
    techs: ["Sam P. (mobile)"],
  },
];

const GAS_INTERVALS: ServiceInterval[] = [
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
];

const EV_INTERVALS: ServiceInterval[] = [
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
];

const DAY_MS = 24 * 60 * 60 * 1000;

// mulberry32 — small seeded PRNG so the demo fleet is identical on every load
function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fraction of an interval used since the last service — mostly healthy, some due soon, a few overdue. */
function intervalProgress(rng: () => number): number {
  const r = rng();
  if (r < 0.08) return 1.03 + rng() * 0.12; // overdue
  if (r < 0.22) return 0.94 + rng() * 0.05; // due soon
  return 0.08 + rng() * 0.8;
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** Random date within the van's history whose month is in `months`, or null if none fits. */
function dateInMonths(rng: () => number, start: Date, end: Date, months: number[]): Date | null {
  const days = Math.floor((end.getTime() - start.getTime()) / DAY_MS);
  const candidates: Date[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(start.getTime() + d * DAY_MS);
    if (months.includes(date.getMonth())) candidates.push(date);
  }
  return candidates.length ? pick(rng, candidates) : null;
}

function plate(rng: () => number): string {
  const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
  const l = () => letters[Math.floor(rng() * letters.length)];
  return `${l()}${l()}${l()} ${Math.floor(1000 + rng() * 9000)}`;
}

function cents(rng: () => number, min: number, max: number): number {
  return Math.round((min + rng() * (max - min)) * 100);
}

function generateVan(site: SiteSpec, index: number, now: Date): FleetVan {
  const unitNumber = site.firstUnit + index;
  const rng = makeRng(unitNumber * 7919);
  const nowMs = now.getTime();

  const spec =
    site.location === "Bozeman"
      ? MODELS[index % 7 === 6 ? 2 : index % 3 === 2 ? 1 : 0]
      : MODELS[index % 4 === 3 ? 2 : index % 2];
  const isEv = spec.powertrain === "electric";
  const annual = Math.round((24000 + rng() * 10000) / 100) * 100;
  const daily = annual / 365;
  const startMileage =
    site.location === "Bozeman" ? Math.round(8000 + rng() * 40000) : Math.round(400 + rng() * 3000);
  const currentMileage = Math.round(startMileage + daily * site.historyDays);
  const year = site.location === "Bozeman" ? pick(rng, [2022, 2023, 2023, 2024]) : 2025;

  const mileageAt = (date: Date) =>
    Math.max(startMileage, Math.round(currentMileage - ((nowMs - date.getTime()) / DAY_MS) * daily));
  const dateAtMileage = (mileage: number) =>
    new Date(nowMs - ((currentMileage - mileage) / daily) * DAY_MS);
  const historyStart = new Date(nowMs - site.historyDays * DAY_MS);

  const logs: FleetLog[] = [];
  let seq = 0;

  const addLog = (
    maintenanceType: MaintenanceType,
    date: Date,
    build: (mileage: number, shop: string, tech: string) => Omit<FleetLog, "id" | "maintenanceType" | "date" | "mileage" | "shop" | "tech" | "location">,
    shopOverride?: string
  ) => {
    const mileage = mileageAt(date);
    const shop = shopOverride ?? site.shop;
    const tech = pick(rng, site.techs);
    const id = `${unitNumber}-${seq++}`;
    const rest = build(mileage, shop, tech);
    rest.photos.forEach((p, i) => (p.id = `${id}-p${i}`));
    logs.push({ id, maintenanceType, date, mileage, shop, tech, location: site.location, ...rest });
  };

  const odometer = (mileage: number): FleetPhoto => ({
    id: "",
    kind: "odometer",
    caption: "Odometer at service",
    mileage,
  });
  const invoice = (shop: string, total: number, date: Date, lines: string[]): FleetPhoto => ({
    id: "",
    kind: "invoice",
    caption: "Shop invoice",
    shop,
    total,
    date,
    lines,
  });

  // Mileage-driven services walk backward from the most recent one
  const rotation = (date: Date, note?: string) => {
    const tread = `${pick(rng, [6, 7, 7, 8, 9])}/32`;
    addLog("tire_rotation", date, (m) => ({
      cost: note ? 0 : cents(rng, 30, 45),
      details: { treadDepth: tread },
      notes: note,
      photos: [
        odometer(m),
        { id: "", kind: "tire", caption: "Tread depth, LF", tireSize: spec.tireSize, treadDepth: tread },
      ],
    }));
  };

  const oilAndRotation = (type: "oil_change" | "tire_rotation") => {
    let mileage = Math.round(currentMileage - intervalProgress(rng) * 7500);
    while (mileage > startMileage) {
      const date = dateAtMileage(mileage);
      if (date < historyStart) break;
      if (type === "oil_change") {
        const cost = cents(rng, 62, 88);
        addLog("oil_change", date, (m, shop) => ({
          cost,
          notes: rng() < 0.3 ? "Topped off washer fluid. No leaks." : undefined,
          details: {
            oilType: "full_synthetic",
            oilWeight: spec.oilWeight,
            oilBrand: spec.oilBrand,
            oilQuantity: spec.oilQuantity,
            filterBrand: spec.filterBrand,
            filterPartNumber: spec.filterPartNumber,
          },
          photos: [
            odometer(m),
            { id: "", kind: "part", caption: "Filter installed", brand: spec.filterBrand, partNumber: spec.filterPartNumber },
            ...(shop.startsWith("In-house")
              ? []
              : [invoice(shop, cost, date, [`Oil & filter — ${spec.oilWeight} synthetic`, "Multi-point check"])]),
          ],
        }));
        rotation(date, "Rotated with oil service.");
      } else {
        rotation(date);
      }
      mileage -= Math.round(7200 + rng() * 600);
    }
  };

  oilAndRotation(isEv ? "tire_rotation" : "oil_change");

  // Time-driven services
  const timeService = (type: "inspection" | "cabin_filter", months: number) => {
    // Newer vans get an intake service shortly after joining the fleet
    let date = new Date(
      Math.max(nowMs - intervalProgress(rng) * months * 30.4 * DAY_MS, historyStart.getTime() + 3 * DAY_MS)
    );
    while (date > historyStart) {
      if (type === "inspection") {
        const padMm = Math.round((4 + rng() * 6) * 10) / 10;
        const cost = cents(rng, 45, 95);
        const serviceDate = date;
        addLog(
          "inspection",
          serviceDate,
          (m, shop) => ({
            cost,
            notes: padMm < 5 ? `Front pads at ${padMm}mm — plan replacement next visit.` : "Passed. Lights, wipers, doors OK.",
            details: {},
            photos: [
              odometer(m),
              { id: "", kind: "brake", caption: "Front pad thickness", padMm },
              invoice(shop, cost, serviceDate, ["Safety inspection", "Brake measurement"]),
            ],
          }),
          site.inspectionShop
        );
      } else {
        addLog("cabin_filter", date, (m) => ({
          cost: cents(rng, 28, 40),
          details: { brand: "Rivian", partNumber: "Cabin filter" },
          photos: [odometer(m), { id: "", kind: "part", caption: "Cabin filter installed", brand: "Rivian", partNumber: "OEM cabin filter" }],
        }));
      }
      date = new Date(date.getTime() - months * 30.4 * DAY_MS);
    }
  };

  timeService("inspection", 6);
  if (isEv) timeService("cabin_filter", 12);

  // One-off repairs — the kind of work that's hardest to verify remotely
  const repairs: Array<() => void> = [
    () => {
      const date = new Date(nowMs - rng() * site.historyDays * DAY_MS);
      const cost = cents(rng, 240, 380);
      addLog("brake_pads", date, (m, shop) => ({
        cost,
        notes: "Front pads replaced. Rotors within spec.",
        details: { position: "Front", brand: "Motorcraft", padType: "Ceramic", padThickness: "12mm", rotorReplaced: false },
        photos: [
          odometer(m),
          { id: "", kind: "brake", caption: "Old pads (before)", padMm: 3.1 },
          { id: "", kind: "brake", caption: "New pads (after)", padMm: 12 },
          invoice(shop, cost, date, ["Front brake pads", "Labor 1.2 hr"]),
        ],
      }));
    },
    () => {
      const date = dateInMonths(rng, historyStart, now, [9, 10]);
      if (!date) return;
      addLog("wiper_blades", date, (m) => ({
        cost: cents(rng, 30, 45),
        notes: "Winter blades installed.",
        details: { brand: "Bosch", partNumber: "Winter 26\"" },
        photos: [odometer(m), { id: "", kind: "part", caption: "Blades installed", brand: "Bosch", partNumber: "Winter 26\"" }],
      }));
    },
    () => {
      const date = new Date(nowMs - rng() * site.historyDays * DAY_MS);
      const cost = cents(rng, 780, 1100);
      addLog("tire_replacement", date, (m, shop) => ({
        cost,
        notes: "Four new tires. Old set at 3/32.",
        details: { size: spec.tireSize, brand: "Michelin", model: "Agilis CrossClimate", treadDepth: "12/32", positions: undefined },
        photos: [
          odometer(m),
          { id: "", kind: "tire", caption: "New tire sidewall", tireSize: spec.tireSize, treadDepth: "12/32" },
          { id: "", kind: "tire", caption: "Old tire (removed)", tireSize: spec.tireSize, treadDepth: "3/32" },
          invoice(shop, cost, date, ["4x Michelin Agilis CrossClimate", "Mount & balance"]),
        ],
      }), site.location === "Bozeman" ? "Tire vendor — Bozeman" : undefined);
    },
    () => {
      const date = new Date(nowMs - rng() * site.historyDays * DAY_MS);
      const cost = cents(rng, 180, 420);
      addLog("other", date, (m, shop) => ({
        cost,
        notes: "Sliding door roller replaced — door was sticking on cold mornings.",
        details: {},
        photos: [
          odometer(m),
          { id: "", kind: "damage", caption: "Worn roller (before)" },
          invoice(shop, cost, date, ["Sliding door roller assy", "Labor 0.8 hr"]),
        ],
      }));
    },
  ];
  const batteryDate = !isEv && rng() < 0.12 ? dateInMonths(rng, historyStart, now, [11, 0, 1]) : null;
  if (batteryDate) {
    const date = batteryDate;
    const cost = cents(rng, 190, 260);
    addLog("battery", date, (m, shop) => ({
      cost,
      notes: "No-start at -18°F. Battery failed load test, replaced.",
      details: { brand: "Motorcraft", partNumber: "BXT-94RH7" },
      photos: [
        odometer(m),
        { id: "", kind: "part", caption: "New battery", brand: "Motorcraft", partNumber: "BXT-94RH7" },
        invoice(shop, cost, date, ["Battery", "Load test", "Terminal clean"]),
      ],
    }));
  }
  const repairCount = rng() < 0.45 ? 0 : rng() < 0.7 ? 1 : 2;
  for (let i = 0; i < repairCount; i++) pick(rng, repairs)();

  logs.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    id: `van-${unitNumber}`,
    unit: `Van ${unitNumber}`,
    location: site.location,
    status: "in_service",
    year,
    make: spec.make,
    model: spec.model,
    powertrain: spec.powertrain,
    plate: plate(rng),
    currentMileage,
    estimatedAnnualMileage: annual,
    addedAt: historyStart,
    serviceIntervals: isEv ? EV_INTERVALS : GAS_INTERVALS,
    logs,
  };
}

const STATUS_OVERRIDES: Record<string, { status: VanStatus; statusNote: string }> = {
  "van-117": { status: "at_shop", statusNote: "Front pads + rotors — back tomorrow" },
  "van-132": { status: "down", statusNote: "Rear bumper damage — waiting on part" },
  "van-148": { status: "at_shop", statusNote: "Check-engine light — diagnosing" },
  "van-206": { status: "at_shop", statusNote: "Tire replacement at partner shop" },
  "van-303": { status: "down", statusNote: "Sliding door off track — mobile tech scheduled" },
};

export function generateFleet(now: Date): FleetVan[] {
  return SITES.flatMap((site) =>
    Array.from({ length: site.count }, (_, i) => {
      const van = generateVan(site, i, now);
      return { ...van, ...STATUS_OVERRIDES[van.id] };
    })
  );
}

export const FLEET_LOCATIONS: FleetLocation[] = SITES.map((s) => s.location);
