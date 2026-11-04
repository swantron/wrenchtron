import { isValidVin, normalizeVin, VIN_PATTERN } from "@/utils/vin";

// Turns a van list pasted from a spreadsheet (or a CSV file) into rows to
// review before import. Only the VIN is required. With a header row the
// columns can be in any order; without one they're read as
// VIN, unit, plate, site, odometer.

export type ImportColumn = "vin" | "unit" | "plate" | "site" | "odometer";

export interface ImportIssue {
  /** Errors keep the row out of the import; warnings don't. */
  level: "error" | "warning";
  message: string;
}

export interface ImportRow {
  /** 1-based line in the pasted text, for pointing at problems. */
  line: number;
  vin: string;
  unit: string;
  plate?: string;
  site?: string;
  odometer?: number;
  issues: ImportIssue[];
}

const DEFAULT_ORDER: ImportColumn[] = ["vin", "unit", "plate", "site", "odometer"];

const HEADER_PATTERNS: [ImportColumn, RegExp][] = [
  ["vin", /\bvin\b/i],
  ["odometer", /odo|mile|mileage|\bmi\b|\bkm\b/i],
  ["plate", /plate|\btag\b|license|licence/i],
  ["site", /site|station|yard|location|depot|\blot\b|branch/i],
  ["unit", /unit|van|\bno\b|number|#|name|asset|fleet/i],
];

/**
 * Splits one line on tabs (spreadsheet paste) or commas (CSV), honoring quotes.
 * Semicolons count when there's no comma: Excel saves CSV that way in some locales.
 */
export function splitCells(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
  const unquoted = line.replace(/"[^"]*"/g, "");
  const separator = !unquoted.includes(",") && unquoted.includes(";") ? ";" : ",";
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === separator && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

/** Column order from a header row, or null when the line is data. */
function readHeader(cells: string[]): (ImportColumn | null)[] | null {
  if (cells.some((c) => VIN_PATTERN.test(normalizeVin(c)))) return null;
  const columns = cells.map((c) => HEADER_PATTERNS.find(([, re]) => re.test(c))?.[0] ?? null);
  return columns.includes("vin") ? columns : null;
}

export function parseOdometer(raw: string): number | undefined {
  const digits = raw.replace(/[,\s]|mi(les)?$|km$/gi, "");
  if (!/^\d+(\.\d+)?$/.test(digits)) return undefined;
  return Math.round(Number(digits));
}

/** "117" reads as "Van 117"; anything with letters is kept as typed. */
export function formatUnit(raw: string): string {
  const trimmed = raw.trim();
  return /^#?\d+$/.test(trimmed) ? `Van ${trimmed.replace("#", "")}` : trimmed;
}

/**
 * Parses pasted text into rows. `existingVins` are vans already in the fleet;
 * those rows are flagged so an import never duplicates a van.
 */
export function parseVanList(text: string, existingVins: Iterable<string> = []): ImportRow[] {
  const existing = new Set([...existingVins].map(normalizeVin));
  const lines = text.split(/\r?\n/);
  let columns: (ImportColumn | null)[] | null = null;
  const rows: ImportRow[] = [];
  const seen = new Map<string, number>();

  lines.forEach((text, index) => {
    if (!text.trim()) return;
    const cells = splitCells(text);
    if (columns === null && rows.length === 0) {
      const header = readHeader(cells);
      if (header) {
        columns = header;
        return;
      }
    }

    const values: Partial<Record<ImportColumn, string>> = {};
    if (columns) {
      columns.forEach((col, i) => {
        if (col && cells[i] && !values[col]) values[col] = cells[i];
      });
    } else {
      // No header: the VIN can sit in any column, the rest go in the default order
      const vinIndex = cells.findIndex((c) => VIN_PATTERN.test(normalizeVin(c)));
      const rest = vinIndex >= 0 ? cells.filter((_, i) => i !== vinIndex) : cells.slice(1);
      values.vin = vinIndex >= 0 ? cells[vinIndex] : cells[0];
      DEFAULT_ORDER.slice(1).forEach((col, i) => {
        if (rest[i]) values[col] = rest[i];
      });
    }

    const vin = normalizeVin(values.vin ?? "");
    const issues: ImportIssue[] = [];
    if (!VIN_PATTERN.test(vin)) {
      issues.push({
        level: "error",
        message: vin ? `"${values.vin}" isn't a VIN (17 letters and digits, no I, O or Q)` : "No VIN on this line",
      });
    } else {
      if (!isValidVin(vin)) issues.push({ level: "warning", message: "Check digit doesn't match — look for a typo" });
      if (existing.has(vin)) issues.push({ level: "error", message: "Already in the fleet" });
      const firstLine = seen.get(vin);
      if (firstLine !== undefined) issues.push({ level: "error", message: `Same VIN as line ${firstLine}` });
      else seen.set(vin, index + 1);
    }

    const odometer = values.odometer ? parseOdometer(values.odometer) : undefined;
    if (values.odometer && odometer === undefined) {
      issues.push({ level: "warning", message: `Odometer "${values.odometer}" isn't a number — left blank` });
    }

    rows.push({
      line: index + 1,
      vin,
      unit: values.unit ? formatUnit(values.unit) : VIN_PATTERN.test(vin) ? `Van ${vin.slice(-4)}` : "",
      plate: values.plate || undefined,
      site: values.site || undefined,
      odometer,
      issues,
    });
  });

  return rows;
}

export function importable(row: ImportRow): boolean {
  return !row.issues.some((i) => i.level === "error");
}
