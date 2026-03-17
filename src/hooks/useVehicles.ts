"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "./useAuth";
import { subscribeToVehicles } from "@/lib/firebase/firestore";
import type { Vehicle } from "@/types/firestore";

export function useVehicles(options?: { archived?: boolean }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUid = useRef<string | null>(null);
  const archived = options?.archived ?? false;

  useEffect(() => {
    if (!user) {
      if (prevUid.current !== null) {
        prevUid.current = null;
      }
      return;
    }

    prevUid.current = user.uid;
    const unsubscribe = subscribeToVehicles(
      user.uid,
      (v) => {
        setVehicles(v);
        setLoading(false);
      },
      () => setLoading(false),
      { archived }
    );

    return unsubscribe;
  }, [user, archived]);

  const isLoading = loading && !!user;

  return { vehicles: user ? vehicles : [], loading: isLoading };
}
