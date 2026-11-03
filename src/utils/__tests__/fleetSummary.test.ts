import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { summarizeLogs } from "@/utils/fleetSummary";
import type { FleetLog } from "@/types/fleet";
import type { MaintenanceType } from "@/types/maintenance";

const day = (iso: string) => Timestamp.fromDate(new Date(`${iso}T12:00:00`));

function log(id: string, visitId: string, date: string, type: MaintenanceType, extra: Partial<FleetLog> = {}): FleetLog {
  return {
    id,
    visitId,
    maintenanceType: type,
    date: day(date),
    mileage: Number(date.slice(5, 7)) * 1000,
    cost: 0,
    shop: "Yard",
    receiptPaths: [],
    details: {},
    loggedBy: { uid: "u", name: "Kayla S." },
    siteId: "bzn",
    photos: [],
    createdAt: day(date),
    updatedAt: day(date),
    ...extra,
  };
}

describe("summarizeLogs", () => {
  it("keeps the latest log of each service type", () => {
    const { serviceSummary } = summarizeLogs([
      log("a", "v1", "2026-03-01", "oil_change"),
      log("b", "v2", "2026-09-01", "oil_change"),
      log("c", "v2", "2026-09-01", "tire_rotation"),
      log("d", "v3", "2026-06-01", "inspection"),
    ]);
    expect(serviceSummary.oil_change?.logId).toBe("b");
    expect(serviceSummary.oil_change?.mileage).toBe(9000);
    expect(serviceSummary.tire_rotation?.logId).toBe("c");
    expect(serviceSummary.inspection?.logId).toBe("d");
  });

  it("rebuilds the last visit from every log in it, photos included", () => {
    const photo = { path: "p", url: "u", kind: "odometer" as const };
    const { lastVisit } = summarizeLogs([
      log("a", "v1", "2026-03-01", "oil_change"),
      log("b", "v2", "2026-09-01", "oil_change", { photos: [photo], notes: "Leaking" }),
      log("c", "v2", "2026-09-01", "tire_rotation"),
    ]);
    expect(lastVisit?.visitId).toBe("v2");
    expect(lastVisit?.types.sort()).toEqual(["oil_change", "tire_rotation"]);
    expect(lastVisit?.photos).toEqual([photo]);
    expect(lastVisit?.notes).toBe("Leaking");
  });

  it("falls back to the visit before when the newest is gone, and to nothing when all are", () => {
    expect(summarizeLogs([log("a", "v1", "2026-03-01", "brake_pads", { title: "Brakes" })]).lastVisit).toMatchObject({
      visitId: "v1",
      title: "Brakes",
    });
    expect(summarizeLogs([])).toEqual({ serviceSummary: {}, lastVisit: null });
  });
});
