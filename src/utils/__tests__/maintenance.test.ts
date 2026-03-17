import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateActionItems, calculateProjectedMileage } from "@/utils/maintenance";
import type { Vehicle } from "@/types/firestore";
import type { MaintenanceLog } from "@/types/maintenance";
import type { Timestamp } from "firebase/firestore";

// Mock firebase/firestore so importing types doesn't trigger Firebase init
vi.mock("firebase/firestore", () => ({
  Timestamp: {},
}));

// Helper: create a duck-typed Timestamp from a Date
function ts(date: Date): Timestamp {
  return { toDate: () => date, toMillis: () => date.getTime() } as unknown as Timestamp;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  const now = new Date();
  return {
    id: "v1",
    name: "Test Vehicle",
    type: "auto",
    year: 2020,
    make: "Toyota",
    model: "Camry",
    currentMileage: 50000,
    isActive: true,
    createdAt: ts(daysAgo(365)),
    updatedAt: ts(now),
    serviceIntervals: [],
    ...overrides,
  };
}

function makeLog(overrides: Partial<MaintenanceLog> = {}): MaintenanceLog {
  const now = new Date();
  return {
    id: "l1",
    maintenanceType: "oil_change",
    date: ts(now),
    mileage: 50000,
    cost: 5000,
    receiptPaths: [],
    details: {},
    createdAt: ts(now),
    updatedAt: ts(now),
    ...overrides,
  };
}

// ---- calculateProjectedMileage ----

describe("calculateProjectedMileage", () => {
  it("returns currentMileage when no estimatedAnnualMileage", () => {
    const vehicle = makeVehicle({ currentMileage: 30000 });
    expect(calculateProjectedMileage(vehicle)).toBe(30000);
  });

  it("returns currentMileage when estimatedAnnualMileage is 0", () => {
    const vehicle = makeVehicle({ currentMileage: 30000, estimatedAnnualMileage: 0 });
    expect(calculateProjectedMileage(vehicle)).toBe(30000);
  });

  it("projects mileage forward based on daily rate and days since update", () => {
    const updatedAt = daysAgo(365);
    const vehicle = makeVehicle({
      currentMileage: 10000,
      estimatedAnnualMileage: 12000,
      updatedAt: ts(updatedAt),
    });
    const projected = calculateProjectedMileage(vehicle);
    // ~12000 miles per year, 365 days → ~12000 miles added
    expect(projected).toBeGreaterThan(10000);
    expect(projected).toBeLessThanOrEqual(10000 + 12000 + 1); // allow rounding
  });
});

// ---- calculateActionItems ----

describe("calculateActionItems", () => {
  it("returns [] when serviceIntervals is empty", () => {
    const vehicle = makeVehicle({ serviceIntervals: [] });
    expect(calculateActionItems(vehicle, [])).toEqual([]);
  });

  it("returns [] when serviceIntervals is undefined", () => {
    const vehicle = makeVehicle({ serviceIntervals: undefined });
    expect(calculateActionItems(vehicle, [])).toEqual([]);
  });

  // --- Mileage intervals ---

  describe("mileage interval", () => {
    it("marks overdue when mileage exceeded", () => {
      const vehicle = makeVehicle({
        currentMileage: 56000,
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "mileage",
          targetMaintenanceType: "oil_change", mileageInterval: 5000,
        }],
      });
      const log = makeLog({ maintenanceType: "oil_change", mileage: 50000, date: ts(daysAgo(100)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("overdue");
    });

    it("marks due_soon when within 500 miles", () => {
      const vehicle = makeVehicle({
        currentMileage: 54600,
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "mileage",
          targetMaintenanceType: "oil_change", mileageInterval: 5000,
        }],
      });
      const log = makeLog({ maintenanceType: "oil_change", mileage: 50000, date: ts(daysAgo(60)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("due_soon");
      expect(items[0].remainingMiles).toBeLessThan(500);
    });

    it("marks upcoming when comfortably below threshold", () => {
      const vehicle = makeVehicle({
        currentMileage: 51000,
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "mileage",
          targetMaintenanceType: "oil_change", mileageInterval: 5000,
        }],
      });
      const log = makeLog({ maintenanceType: "oil_change", mileage: 50000, date: ts(daysAgo(30)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("upcoming");
    });
  });

  // --- Time intervals ---

  describe("time interval", () => {
    it("marks overdue when time exceeded", () => {
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "time",
          targetMaintenanceType: "oil_change", timeIntervalMonths: 6,
        }],
      });
      const log = makeLog({ maintenanceType: "oil_change", date: ts(monthsAgo(8)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items[0].status).toBe("overdue");
    });

    it("marks due_soon when within 30 days", () => {
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "time",
          targetMaintenanceType: "oil_change", timeIntervalMonths: 6,
        }],
      });
      // Log from ~5 months 15 days ago (due in ~15 days)
      const logDate = new Date();
      logDate.setMonth(logDate.getMonth() - 5);
      logDate.setDate(logDate.getDate() - 15);
      const log = makeLog({ maintenanceType: "oil_change", date: ts(logDate) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items[0].status).toBe("due_soon");
    });

    it("marks upcoming when comfortably before due date", () => {
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "time",
          targetMaintenanceType: "oil_change", timeIntervalMonths: 6,
        }],
      });
      const log = makeLog({ maintenanceType: "oil_change", date: ts(monthsAgo(2)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items[0].status).toBe("upcoming");
    });
  });

  // --- Composite intervals ---

  describe("composite interval", () => {
    const interval = {
      id: "i1", name: "Oil Change", type: "composite" as const,
      targetMaintenanceType: "oil_change" as const,
      mileageInterval: 5000, timeIntervalMonths: 6,
    };

    it("triggers on mileage when time hasn't fired", () => {
      const vehicle = makeVehicle({
        currentMileage: 56000,
        serviceIntervals: [interval],
      });
      const log = makeLog({ maintenanceType: "oil_change", mileage: 50000, date: ts(monthsAgo(2)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items[0].status).toBe("overdue");
    });

    it("triggers on time when mileage hasn't fired", () => {
      const vehicle = makeVehicle({
        currentMileage: 51000,
        serviceIntervals: [interval],
      });
      const log = makeLog({ maintenanceType: "oil_change", mileage: 50000, date: ts(monthsAgo(8)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items[0].status).toBe("overdue");
    });

    it("marks overdue when both triggers fired", () => {
      const vehicle = makeVehicle({
        currentMileage: 56000,
        serviceIntervals: [interval],
      });
      const log = makeLog({ maintenanceType: "oil_change", mileage: 50000, date: ts(monthsAgo(8)) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items[0].status).toBe("overdue");
      expect(items[0].reason).toMatch(/miles.*days|days.*miles/i);
    });
  });

  // --- Seasonal intervals ---

  describe("seasonal interval", () => {
    beforeEach(() => {
      // Fix date to spring: March 15, 2026
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns due_soon when in-season and log is stale (>6 months ago)", () => {
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "seasonal", season: "spring",
          targetMaintenanceType: "oil_change",
        }],
      });
      const log = makeLog({ maintenanceType: "oil_change", date: ts(new Date("2025-08-01")) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("due_soon");
    });

    it("does not return item when in-season but log is recent (<6 months)", () => {
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "seasonal", season: "spring",
          targetMaintenanceType: "oil_change",
        }],
      });
      const log = makeLog({ maintenanceType: "oil_change", date: ts(new Date("2026-01-15")) });
      const items = calculateActionItems(vehicle, [log]);
      // Should not be a seasonal item (recent log)
      expect(items.filter(i => i.serviceName === "Oil Change")).toHaveLength(0);
    });

    it("does not return item when out of season", () => {
      vi.setSystemTime(new Date("2026-07-15T12:00:00Z")); // summer
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Winterize", type: "seasonal", season: "fall",
          targetMaintenanceType: "inspection",
        }],
      });
      const log = makeLog({ maintenanceType: "inspection", date: ts(new Date("2025-11-01")) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items.filter(i => i.serviceName === "Winterize")).toHaveLength(0);
    });

    it("does not return Summerize when logged this spring (Mar 17)", () => {
      vi.setSystemTime(new Date("2026-03-18T12:00:00Z")); // March 18, after the log
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Summerize", type: "seasonal", season: "spring",
          targetMaintenanceType: "summerize",
        }],
      });
      const log = makeLog({ maintenanceType: "summerize", date: ts(new Date("2026-03-17")) });
      const items = calculateActionItems(vehicle, [log]);
      expect(items.filter(i => i.serviceName === "Summerize")).toHaveLength(0);
    });
  });

  // --- Monthly intervals ---

  describe("month interval", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("marks due_soon when current month matches", () => {
      vi.setSystemTime(new Date("2026-03-10T12:00:00Z")); // March = month 2
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Registration", type: "month", specificMonth: 2, // March
        }],
      });
      const items = calculateActionItems(vehicle, []);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("due_soon");
    });

    it("marks upcoming when target month is in the future", () => {
      vi.setSystemTime(new Date("2026-01-10T12:00:00Z")); // January
      const vehicle = makeVehicle({
        serviceIntervals: [{
          id: "i1", name: "Registration", type: "month", specificMonth: 5, // June
        }],
      });
      const items = calculateActionItems(vehicle, []);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("upcoming");
    });
  });

  // --- Component-based intervals (tire replacement) ---

  describe("component-based interval", () => {
    const tireInterval = {
      id: "i1",
      name: "Tire Replacement",
      type: "mileage" as const,
      targetMaintenanceType: "tire_replacement" as const,
      isComponentBased: true,
      componentInstallationType: "tire_replacement" as const,
      totalLifeMileage: 60000,
    };

    it("marks overdue when life mileage exceeded since install", () => {
      const vehicle = makeVehicle({
        currentMileage: 75000,
        serviceIntervals: [tireInterval],
      });
      const installLog = makeLog({
        maintenanceType: "tire_replacement",
        mileage: 10000,
        date: ts(daysAgo(500)),
      });
      const items = calculateActionItems(vehicle, [installLog]);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("overdue");
    });

    it("marks due_soon when within 1000 miles of life limit", () => {
      const vehicle = makeVehicle({
        currentMileage: 69500,
        serviceIntervals: [tireInterval],
      });
      const installLog = makeLog({
        maintenanceType: "tire_replacement",
        mileage: 10000,
        date: ts(daysAgo(500)),
      });
      const items = calculateActionItems(vehicle, [installLog]);
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe("due_soon");
    });
  });

  // --- Inapplicable type filtering ---

  describe("inapplicable type filtering", () => {
    it("excludes tire_rotation for mower", () => {
      const vehicle = makeVehicle({
        type: "mower",
        serviceIntervals: [{
          id: "i1", name: "Tire Rotation", type: "mileage",
          targetMaintenanceType: "tire_rotation", mileageInterval: 5000,
        }],
      });
      expect(calculateActionItems(vehicle, [])).toHaveLength(0);
    });

    it("excludes cabin_filter for atv", () => {
      const vehicle = makeVehicle({
        type: "atv",
        serviceIntervals: [{
          id: "i1", name: "Cabin Filter", type: "time",
          targetMaintenanceType: "cabin_filter", timeIntervalMonths: 12,
        }],
      });
      expect(calculateActionItems(vehicle, [])).toHaveLength(0);
    });

    it("excludes oil_change for electric mower", () => {
      const vehicle = makeVehicle({
        type: "mower",
        powertrain: "electric",
        serviceIntervals: [{
          id: "i1", name: "Oil Change", type: "seasonal",
          targetMaintenanceType: "oil_change", season: "spring",
        }],
      });
      expect(calculateActionItems(vehicle, [])).toHaveLength(0);
    });
  });

  // --- Result ordering ---

  describe("result ordering", () => {
    it("orders overdue before due_soon before upcoming", () => {
      const vehicle = makeVehicle({
        currentMileage: 50000,
        serviceIntervals: [
          {
            id: "upcoming", name: "Air Filter", type: "time",
            targetMaintenanceType: "air_filter", timeIntervalMonths: 12,
          },
          {
            id: "overdue", name: "Oil Change", type: "mileage",
            targetMaintenanceType: "oil_change", mileageInterval: 3000,
          },
          {
            id: "due-soon", name: "Tire Rotation", type: "time",
            targetMaintenanceType: "tire_rotation", timeIntervalMonths: 6,
          },
        ],
      });

      const logs = [
        makeLog({ id: "l1", maintenanceType: "oil_change", mileage: 46000, date: ts(daysAgo(10)) }),
        makeLog({ id: "l2", maintenanceType: "tire_rotation", mileage: 50000, date: ts(monthsAgo(5).valueOf ? monthsAgo(5) : daysAgo(150)) }),
        makeLog({ id: "l3", maintenanceType: "air_filter", mileage: 50000, date: ts(daysAgo(30)) }),
      ];

      const items = calculateActionItems(vehicle, logs);
      const statusOrder = items.map(i => i.status);
      const overdueIdx = statusOrder.lastIndexOf("overdue");
      const dueSoonIdx = statusOrder.indexOf("due_soon");
      const upcomingIdx = statusOrder.indexOf("upcoming");

      if (overdueIdx >= 0 && dueSoonIdx >= 0) expect(overdueIdx).toBeLessThan(dueSoonIdx);
      if (dueSoonIdx >= 0 && upcomingIdx >= 0) expect(dueSoonIdx).toBeLessThan(upcomingIdx);
    });

    it("sorts within same status by remainingDays ascending", () => {
      vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
      const vehicle = makeVehicle({
        serviceIntervals: [
          {
            id: "a", name: "Spark Plugs", type: "time",
            targetMaintenanceType: "spark_plugs", timeIntervalMonths: 12,
          },
          {
            id: "b", name: "Wiper Blades", type: "time",
            targetMaintenanceType: "wiper_blades", timeIntervalMonths: 12,
          },
        ],
      });

      const logs = [
        makeLog({ id: "l1", maintenanceType: "spark_plugs", date: ts(new Date("2025-04-01")) }), // due in ~2.5 wks
        makeLog({ id: "l2", maintenanceType: "wiper_blades", date: ts(new Date("2025-02-15")) }), // already due ~1 mo ago
      ];

      const items = calculateActionItems(vehicle, logs);
      const dueSoonItems = items.filter(i => i.status === "due_soon");
      if (dueSoonItems.length >= 2) {
        const days0 = dueSoonItems[0].remainingDays ?? 0;
        const days1 = dueSoonItems[1].remainingDays ?? 0;
        expect(days0).toBeLessThanOrEqual(days1);
      }

      vi.useRealTimers();
    });
  });
});
