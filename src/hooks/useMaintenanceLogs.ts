"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { subscribeToMaintenanceLogs } from "@/lib/firebase/firestore";
import type { MaintenanceLog } from "@/types/maintenance";

export function useMaintenanceLogs(vehicleId: string | null) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !vehicleId) {
      return;
    }

    const unsubscribe = subscribeToMaintenanceLogs(user.uid, vehicleId, (l) => {
      setLogs(l);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, vehicleId]);

  const isLoading = loading && !!user && !!vehicleId;

  return { logs: user && vehicleId ? logs : [], loading: isLoading };
}
