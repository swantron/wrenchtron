import type { Powertrain, ServiceInterval } from "@/types/firestore";
import type { MaintenanceType } from "@/types/maintenance";
import { ELECTRIC_VAN, GAS_SEVERE } from "@/data/fleetSchedules";
import { vinCheckDigit } from "@/utils/vin";

// Synthetic delivery fleet for /demo/fleet. Generated deterministically and
// anchored to `now` so due/overdue statuses stay realistic whenever it's viewed.

export type FleetLocation = "Bozeman" | "Billings" | "Helena";
export type VanStatus = "in_service" | "at_shop" | "down";
export type PhotoKind = "odometer" | "part" | "invoice" | "tire" | "brake" | "damage" | "other";

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
  location: string;
  notes?: string;
  /** Shown instead of the maintenance type, e.g. for a driver's damage report. */
  title?: string;
  details: Record<string, string | number | boolean | undefined>;
  photos: FleetPhoto[];
}

export interface FleetVan {
  id: string;
  unit: string;
  location: string;
  status: VanStatus;
  statusNote?: string;
  year: number;
  make: string;
  model: string;
  powertrain: Powertrain;
  plate: string;
  vin: string;
  currentMileage: number;
  estimatedAnnualMileage: number;
  /** When the van joined the fleet (start of its service history). */
  addedAt: Date;
  serviceIntervals: ServiceInterval[];
  logs: FleetLog[]; // newest first
  /**
   * Latest log per service type, for due dates, when `logs` is only part of the
   * history (the real board keeps just each van's last visit).
   */
  serviceLogs?: FleetLog[];
}

interface ModelSpec {
  make: string;
  model: string;
  /** VIN positions 1–8: manufacturer prefix plus model/body codes. */
  vinPrefix: string;
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
    model: "Transit 250",
    vinPrefix: "1FTBR1C8",
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
    model: "ProMaster 2500",
    vinPrefix: "3C6LRVDG",
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
    vinPrefix: "7FCEHBB1",
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

const VIN_YEAR: Record<number, string> = { 2022: "N", 2023: "P", 2024: "R", 2025: "S" };
/** A VIN with a valid check digit, so it holds up in a decoder. */
function vin(prefix: string, year: number, unitNumber: number): string {
  const rng = makeRng(unitNumber * 104729);
  const plant = "ABCKS"[Math.floor(rng() * 5)];
  const serial = String(Math.floor(100000 + rng() * 900000));
  const chars = `${prefix}0${VIN_YEAR[year]}${plant}${serial}`.split("");
  chars[8] = vinCheckDigit(chars.join(""));
  return chars.join("");
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
  const rotation = (date: Date, withOil = false) => {
    const tread = `${pick(rng, [6, 7, 7, 8, 9])}/32`;
    addLog("tire_rotation", date, (m) => ({
      // Free when done alongside an oil change
      cost: withOil ? 0 : cents(rng, 30, 45),
      details: { treadDepth: tread },
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
        rotation(date, true);
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

  // Tread wears down between rotations and resets with new tires
  logs.sort((a, b) => a.date.getTime() - b.date.getTime());
  const newTires = logs.find((l) => l.maintenanceType === "tire_replacement");
  // A worn-out set ahead of new tires, otherwise somewhere mid-life
  let treadBase = newTires
    ? newTires.mileage - 48000
    : startMileage - Math.round(makeRng(unitNumber * 31)() * 12000);
  for (const log of logs) {
    if (log === newTires) treadBase = log.mileage;
    if (log.maintenanceType !== "tire_rotation") continue;
    const worn = Math.floor((log.mileage - treadBase) / 6500);
    const tread = `${Math.min(11, Math.max(4, 11 - worn))}/32`;
    log.details.treadDepth = tread;
    for (const photo of log.photos) if (photo.kind === "tire") photo.treadDepth = tread;
  }
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
    vin: vin(spec.vinPrefix, year, unitNumber),
    currentMileage,
    estimatedAnnualMileage: annual,
    addedAt: historyStart,
    serviceIntervals: (isEv ? ELECTRIC_VAN : GAS_SEVERE).intervals,
    logs,
  };
}

interface StatusOverride {
  status: VanStatus;
  statusNote: string;
  /** The report that took the van off the road, with its photo. */
  report: { hoursAgo: number; title: string; by: string; notes: string; photo?: Omit<FleetPhoto, "id"> };
}

const STATUS_OVERRIDES: Record<string, StatusOverride> = {
  "van-117": {
    status: "at_shop",
    statusNote: "Front pads + rotors — back tomorrow",
    report: {
      hoursAgo: 26,
      title: "Brake check",
      by: "Kayla S.",
      notes: "Driver reported grinding at stops. Front pads at 2.4 mm, rotors scored. Sent to the shop.",
      photo: { kind: "brake", caption: "Front pads at 2.4 mm", padMm: 2.4 },
    },
  },
  "van-132": {
    status: "down",
    statusNote: "Rear bumper damage — waiting on part",
    report: {
      hoursAgo: 52,
      title: "Damage report",
      by: "Devon W. (driver)",
      notes: "Backed into a loading-dock post. Bumper cover cracked, sensor bracket bent. Part ordered.",
      photo: { kind: "damage", caption: "Rear bumper damage" },
    },
  },
  "van-148": {
    status: "at_shop",
    statusNote: "Check-engine light — diagnosing",
    report: {
      hoursAgo: 20,
      title: "Check-engine light",
      by: "Luis M.",
      notes: "Light flashing under load. Code scan: P0301, cylinder 1 misfire. Pulled from the route.",
    },
  },
  "van-206": {
    status: "at_shop",
    statusNote: "Tire replacement at partner shop",
    report: {
      hoursAgo: 30,
      title: "Tire check",
      by: "Marcus B. (partner)",
      notes: "Rears at 3/32, inside edge worn. Four new tires quoted.",
      photo: { kind: "tire", caption: "Rear tread at 3/32", tireSize: "225/75R16C", treadDepth: "3/32" },
    },
  },
  "van-303": {
    status: "down",
    statusNote: "Sliding door off track — mobile tech scheduled",
    report: {
      hoursAgo: 40,
      title: "Damage report",
      by: "Jess R. (driver)",
      notes: "Sliding door came off the lower track and won't latch. Van parked at the Helena lot.",
      photo: { kind: "damage", caption: "Sliding door off track" },
    },
  },
};

function withOverride(van: FleetVan, now: Date): FleetVan {
  const override = STATUS_OVERRIDES[van.id];
  if (!override) return van;
  const { report, ...status } = override;
  const id = `${van.id}-report`;
  const log: FleetLog = {
    id,
    maintenanceType: "other",
    title: report.title,
    date: new Date(now.getTime() - report.hoursAgo * 3600 * 1000),
    mileage: van.currentMileage,
    cost: 0,
    shop: "Reported from the route",
    tech: report.by,
    location: van.location,
    notes: report.notes,
    details: {},
    photos: [
      { id: `${id}-p0`, kind: "odometer", caption: "Odometer at report", mileage: van.currentMileage },
      ...(report.photo ? [{ ...report.photo, id: `${id}-p1` }] : []),
    ],
  };
  return { ...van, ...status, logs: [log, ...van.logs] };
}

export function generateFleet(now: Date): FleetVan[] {
  return SITES.flatMap((site) =>
    Array.from({ length: site.count }, (_, i) => withOverride(generateVan(site, i, now), now))
  );
}

export const FLEET_LOCATIONS: FleetLocation[] = SITES.map((s) => s.location);
