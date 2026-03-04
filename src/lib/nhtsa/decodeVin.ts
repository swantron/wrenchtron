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
