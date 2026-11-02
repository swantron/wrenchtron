import { describe, expect, it } from "vitest";
import { formatUnit, importable, parseOdometer, parseVanList, splitCells } from "@/utils/fleetImport";
import { isValidVin, vinCheckDigit } from "@/utils/vin";

// Real-format VINs with correct check digits
const vinWithCheck = (v: string) => v.slice(0, 8) + vinCheckDigit(v) + v.slice(9);
const V1 = vinWithCheck("1FTBR1C80PKA12345");
const V2 = vinWithCheck("3C6LRVDG0PE512345");
const V3 = vinWithCheck("7FCEHBB10PN012345");

describe("vin check digit", () => {
  it("accepts a VIN whose 9th character matches", () => {
    expect(isValidVin(V1)).toBe(true);
    expect(isValidVin("11111111111111111")).toBe(true); // the textbook example
  });

  it("rejects a one-character typo", () => {
    expect(isValidVin(V1.slice(0, 16) + (V1[16] === "1" ? "2" : "1"))).toBe(false);
  });

  it("rejects I, O and Q", () => {
    expect(isValidVin("1FTBR1C8OPKA12345")).toBe(false);
  });
});

describe("splitCells", () => {
  it("splits spreadsheet tabs", () => {
    expect(splitCells("a\tb\t c ")).toEqual(["a", "b", "c"]);
  });

  it("splits CSV with quoted commas", () => {
    expect(splitCells('117,"Bozeman, MT",42,000')).toEqual(["117", "Bozeman, MT", "42", "000"]);
  });
});

describe("parseOdometer and formatUnit", () => {
  it("reads odometers with commas and units", () => {
    expect(parseOdometer("42,118")).toBe(42118);
    expect(parseOdometer("42118 mi")).toBe(42118);
    expect(parseOdometer("n/a")).toBeUndefined();
  });

  it("turns bare numbers into van names", () => {
    expect(formatUnit("117")).toBe("Van 117");
    expect(formatUnit("#117")).toBe("Van 117");
    expect(formatUnit("BZN-14")).toBe("BZN-14");
  });
});

describe("parseVanList", () => {
  it("reads a header row in any column order", () => {
    const rows = parseVanList(
      `Unit #\tPlate\tVIN\tStation\tOdometer\n117\tABC 1234\t${V1}\tBozeman\t42,118`
    );
    expect(rows).toEqual([
      { line: 2, vin: V1, unit: "Van 117", plate: "ABC 1234", site: "Bozeman", odometer: 42118, issues: [] },
    ]);
  });

  it("without a header, finds the VIN in any column and reads the rest in order", () => {
    const [row] = parseVanList(`117, ${V1.toLowerCase()}, ABC 1234, Billings, 900`);
    expect(row).toMatchObject({ vin: V1, unit: "Van 117", plate: "ABC 1234", site: "Billings", odometer: 900 });
  });

  it("accepts a bare list of VINs, naming vans by the last four", () => {
    const rows = parseVanList(`${V1}\n\n${V2}\n`);
    expect(rows.map((r) => r.unit)).toEqual([`Van ${V1.slice(-4)}`, `Van ${V2.slice(-4)}`]);
    expect(rows.every(importable)).toBe(true);
  });

  it("flags duplicates in the paste and vans already in the fleet", () => {
    const rows = parseVanList(`${V1}\n${V2}\n${V1}`, [V2]);
    expect(importable(rows[0])).toBe(true);
    expect(rows[1].issues).toContainEqual({ level: "error", message: "Already in the fleet" });
    expect(rows[2].issues).toContainEqual({ level: "error", message: "Same VIN as line 1" });
  });

  it("rejects lines without a VIN, warns on a bad check digit", () => {
    const typo = V3.slice(0, 16) + (V3[16] === "1" ? "2" : "1");
    const rows = parseVanList(`117, nope\n${typo}`);
    expect(importable(rows[0])).toBe(false);
    expect(importable(rows[1])).toBe(true);
    expect(rows[1].issues[0].level).toBe("warning");
  });

  it("warns and leaves the odometer blank when it isn't a number", () => {
    const [row] = parseVanList(`${V1}, 117, , , unknown`);
    expect(row.odometer).toBeUndefined();
    expect(row.issues).toEqual([{ level: "warning", message: 'Odometer "unknown" isn\'t a number — left blank' }]);
  });
});
