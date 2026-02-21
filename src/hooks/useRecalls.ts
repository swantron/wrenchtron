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
  onResult: (recalls: NHTSARecall[]) => void,
  onError: (msg: string) => void,
): () => void {
  let active = true;

  fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${encodeURIComponent(vin)}`)
    .then(res => {
      if (!res.ok) throw new Error(`NHTSA returned ${res.status}`);
      return res.json();
    })
    .then(data => { if (active) onResult(data.results ?? []); })
    .catch(() => { if (active) onError("Could not load recall data from NHTSA."); });

  return () => { active = false; };
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
    return fetchRecallsByVin(vin, setRecalls, setError);
  }, [vin]);

  return {
    recalls: recalls ?? [],
    loading: !!vin && recalls === null && error === null,
    error,
  };
}
