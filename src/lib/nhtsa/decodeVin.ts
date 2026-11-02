/**
 * NHTSA VPIC DecodeVIN API
 * https://vpic.nhtsa.dot.gov/api/
 * Returns make, model, year, trim, engine, etc. for a 17-character VIN.
 */

export interface DecodeVinResult {
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  engine?: string;
  transmission?: string;
  bodyClass?: string;
}

function findValue(results: { Variable: string; Value: string | null }[], variable: string): string | undefined {
  const row = results.find((r) => r.Variable === variable);
  const val = row?.Value;
  return val && val.trim() && val !== "Not Applicable" ? val.trim() : undefined;
}

export async function decodeVin(vin: string): Promise<DecodeVinResult | null> {
  const clean = vin.replace(/\s/g, "").toUpperCase();
  if (clean.length !== 17) return null;

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(clean)}?format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const results: { Variable: string; Value: string | null }[] = data.Results ?? [];

  const make = findValue(results, "Make");
  const model = findValue(results, "Model");
  const modelYearStr = findValue(results, "Model Year");
  const trim = findValue(results, "Trim") ?? findValue(results, "Trim2") ?? findValue(results, "Series");
  const engineModel = findValue(results, "Engine Model");
  const displacementL = findValue(results, "Displacement (L)");
  const cylinders = findValue(results, "Engine Number of Cylinders");
  const transmissionStyle = findValue(results, "Transmission Style");

  // Build engine string from available parts
  const engineParts: string[] = [];
  if (displacementL) engineParts.push(`${displacementL}L`);
  if (cylinders) engineParts.push(`${cylinders}-Cylinder`);
  if (engineModel) engineParts.push(engineModel);
  const engine = engineParts.length > 0 ? engineParts.join(" ") : undefined;

  const year = modelYearStr ? parseInt(modelYearStr, 10) : undefined;
  if (year !== undefined && (isNaN(year) || year < 1900 || year > 2100)) return null;

  return {
    make: make ?? undefined,
    model: model ?? undefined,
    year,
    trim: trim ?? undefined,
    engine: engine ?? undefined,
    transmission: transmissionStyle ?? undefined,
    bodyClass: findValue(results, "Body Class") ?? undefined,
  };
}

export interface BatchDecodeResult extends DecodeVinResult {
  electric: boolean;
}

/** "FORD" → "Ford", "MERCEDES-BENZ" → "Mercedes-Benz"; short marques like RAM stay as they are. */
function displayMake(make: string): string {
  if (make !== make.toUpperCase() || make.length <= 3) return make;
  return make.toLowerCase().replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());
}

const BATCH_SIZE = 50; // NHTSA's limit per request

/**
 * Decodes many VINs at once with NHTSA's batch endpoint (50 per request).
 * VINs NHTSA can't place are missing from the map; a failed request leaves
 * its whole batch out rather than failing the import.
 */
export async function decodeVins(vins: string[]): Promise<Map<string, BatchDecodeResult>> {
  const decoded = new Map<string, BatchDecodeResult>();
  for (let i = 0; i < vins.length; i += BATCH_SIZE) {
    const batch = vins.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ format: "json", data: batch.join(";") }),
      });
      if (!res.ok) continue;
      const data: { Results?: Record<string, string>[] } = await res.json();
      for (const r of data.Results ?? []) {
        const value = (key: string) => (r[key] && r[key] !== "Not Applicable" ? r[key].trim() : undefined);
        const make = value("Make");
        if (!make) continue;
        const year = value("ModelYear") ? parseInt(value("ModelYear")!, 10) : undefined;
        const engine = [value("DisplacementL") && `${value("DisplacementL")}L`, value("EngineCylinders") && `${value("EngineCylinders")}-Cylinder`]
          .filter(Boolean)
          .join(" ");
        const fuel = `${value("FuelTypePrimary") ?? ""} ${value("ElectrificationLevel") ?? ""}`;
        decoded.set(r.VIN.toUpperCase(), {
          make: displayMake(make),
          model: value("Model"),
          year: year && year > 1900 && year < 2100 ? year : undefined,
          trim: value("Trim") ?? value("Series"),
          engine: engine || undefined,
          bodyClass: value("BodyClass"),
          // Rivian's delivery vans don't always decode a fuel type
          electric: /electric|BEV/i.test(fuel) || make.toUpperCase() === "RIVIAN",
        });
      }
    } catch (error) {
      console.error("NHTSA batch decode failed:", error);
    }
  }
  return decoded;
}
