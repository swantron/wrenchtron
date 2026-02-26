import { useState, useEffect } from "react";

export interface NHTSARecall {
  NHTSACampaignNumber: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  ReportReceivedDate: string;
  Manufacturer: string;
}

// Hoisted outside the hook so setState calls happen in callbacks, not the effect body
function fetchRecallsByVin(
  vin: string,
  signal: AbortSignal,
  onResult: (recalls: NHTSARecall[]) => void,
  onError: (msg: string) => void,
): void {
  fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${encodeURIComponent(vin)}`, { signal })
    .then(res => {
      if (!res.ok) throw new Error(`NHTSA returned ${res.status}`);
      return res.json();
    })
    .then(data => { onResult(data.results ?? []); })
    .catch(err => {
      if (err.name === "AbortError") return;
      onError("Could not load recall data from NHTSA.");
    });
}

interface UseRecallsResult {
  recalls: NHTSARecall[];
  loading: boolean;
  error: string | null;
}

export function useRecalls(vin: string | undefined): UseRecallsResult {
  // null = fetch in-flight; [] = loaded with no results
  const [recalls, setRecalls] = useState<NHTSARecall[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vin) return;
    const controller = new AbortController();
    fetchRecallsByVin(vin, controller.signal, setRecalls, setError);
    return () => { controller.abort(); };
  }, [vin]);

  return {
    recalls: recalls ?? [],
    loading: !!vin && recalls === null && error === null,
    error,
  };
}
