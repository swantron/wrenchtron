import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { csvCell, historyCsv, toCsv, vansCsv } from "@/utils/fleetExport";
import type { FleetLog, FleetVehicle } from "@/types/fleet";

const day = (iso: string) => Timestamp.fromDate(new Date(`${iso}T12:00:00`));
const sites = [{ id: "bzn", name: "Bozeman" }];

function van(unit: string, extra: Partial<FleetVehicle> = {}): FleetVehicle {
  return {
    id: unit,
    unit,
    name: unit,
    type: "auto",
    year: 2023,
    make: "Ford",
    model: "Transit",
    vin: `VIN${unit}`,
    siteId: "bzn",
    currentMileage: 41000,
    status: "in_service",
    isActive: true,
    createdAt: day("2026-10-01"),
    updatedAt: day("2026-10-01"),
    ...extra,
  };
}

function log(date: string, extra: Partial<FleetLog> = {}): FleetLog {
  return {
    maintenanceType: "oil_change",
    date: day(date),
    mileage: 41000,
    cost: 12950,
    shop: "Gallatin Tire",
    receiptPaths: [],
    details: {},
    visitId: "v",
    loggedBy: { uid: "u", name: "Kayla S." },
    siteId: "bzn",
    photos: [],
    createdAt: day(date),
    updatedAt: day(date),
    ...extra,
  };
}

const lines = (csv: string) => csv.replace(/^\uFEFF/, "").trim().split("\r\n");

describe("csvCell", () => {
  it("quotes and doubles embedded quotes", () => {
    expect(csvCell('Said "done", left')).toBe('"Said ""done"", left"');
  });

  it("defuses anything a spreadsheet would run as a formula", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
    expect(csvCell("+1 555")).toBe('"\'+1 555"');
  });

  it("leaves plain and negative numbers alone", () => {
    expect(csvCell(-12.5)).toBe('"-12.5"');
    expect(csvCell(41000)).toBe('"41000"');
    expect(csvCell(undefined)).toBe('""');
  });
});

describe("toCsv", () => {
  it("starts with a BOM so Excel reads UTF-8, and uses CRLF", () => {
    const csv = toCsv(["A"], [["é"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toBe('\uFEFF"A"\r\n"é"\r\n');
  });
});

describe("vansCsv", () => {
  it("lists vans in unit order with site names and status", () => {
    const csv = vansCsv([van("Van 110"), van("Van 9", { status: "down", statusNote: "Bumper" })], sites);
    const rows = lines(csv);
    expect(rows[0]).toContain('"Unit","VIN"');
    expect(rows[1]).toContain('"Van 9"');
    expect(rows[1]).toContain('"Bozeman"');
    expect(rows[1]).toContain('"Down","Bumper"');
    expect(rows[2]).toContain('"Van 110"');
  });
});

describe("historyCsv", () => {
  it("lists every job newest first, with cost in dollars and photo links", () => {
    const csv = historyCsv(
      [
        { vehicle: van("Van 1"), log: log("2026-09-01") },
        {
          vehicle: van("Van 2"),
          log: log("2026-10-15", { title: "Damage report", maintenanceType: "other", cost: 0, photos: [{ path: "p", url: "https://x/1.jpg", kind: "damage" }] }),
        },
      ],
      sites
    );
    const rows = lines(csv);
    expect(rows).toHaveLength(3);
    expect(rows[1]).toBe('"2026-10-15","Van 2","VINVan 2","Damage report","41000","Gallatin Tire","Bozeman","Kayla S.","","","https://x/1.jpg"');
    expect(rows[2]).toContain('"2026-09-01","Van 1","VINVan 1","Oil Change"');
    expect(rows[2]).toContain('"129.50"');
  });
});
