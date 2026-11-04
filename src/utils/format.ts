export function formatCost(cents: number): string {
  if (!cents) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Local YYYY-MM-DD: the value a date input holds, and what every spreadsheet
 * sorts correctly. (toISOString() is the UTC date, a day ahead on a US evening.)
 */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
