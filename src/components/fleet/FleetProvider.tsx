"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToFleet, subscribeToFleetMemberships, subscribeToMember } from "@/lib/firebase/fleet";
import type { Fleet, FleetMember, FleetMembership } from "@/types/fleet";

const ACTIVE_FLEET_KEY = "activeFleetId";

export interface FleetContextType {
  memberships: FleetMembership[];
  /** Fleet currently shown in /fleet pages, or null when the user has none. */
  fleetId: string | null;
  fleet: Fleet | null;
  /** The signed-in user's member doc — the source of truth for their role. */
  member: FleetMember | null;
  /** Membership exists but the fleet can't be read (e.g. the user was removed). */
  noAccess: boolean;
  loading: boolean;
  setActiveFleet: (fleetId: string) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

function readStoredFleetId(): string | null {
  try {
    return typeof window === "undefined" ? null : localStorage.getItem(ACTIVE_FLEET_KEY);
  } catch {
    return null;
  }
}

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<{ uid: string; list: FleetMembership[] } | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(readStoredFleetId);
  // Keyed by fleet id so a stale snapshot from the previous fleet never shows
  const [fleetState, setFleetState] = useState<{ fleetId: string; fleet: Fleet | null; denied: boolean } | null>(null);
  const [memberState, setMemberState] = useState<{ fleetId: string; member: FleetMember | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeToFleetMemberships(
      user.uid,
      (list) => setMemberships({ uid: user.uid, list }),
      () => setMemberships({ uid: user.uid, list: [] })
    );
  }, [user]);

  const list = memberships && user && memberships.uid === user.uid ? memberships.list : null;
  const fleetId = list
    ? (list.find((m) => m.fleetId === chosenId) ?? list[0])?.fleetId ?? null
    : null;

  useEffect(() => {
    if (!fleetId || !user) return;
    const unsubFleet = subscribeToFleet(
      fleetId,
      (fleet) => setFleetState({ fleetId, fleet, denied: false }),
      () => setFleetState({ fleetId, fleet: null, denied: true })
    );
    const unsubMember = subscribeToMember(
      fleetId,
      user.uid,
      (member) => setMemberState({ fleetId, member }),
      () => setMemberState({ fleetId, member: null })
    );
    return () => {
      unsubFleet();
      unsubMember();
    };
  }, [fleetId, user]);

  const setActiveFleet = useCallback((id: string) => {
    setChosenId(id);
    try {
      localStorage.setItem(ACTIVE_FLEET_KEY, id);
    } catch {
      // Private mode — the choice just won't persist
    }
  }, []);

  const fleetReady = fleetState?.fleetId === fleetId && memberState?.fleetId === fleetId;
  const loading = !list || (!!fleetId && !fleetReady);

  const value: FleetContextType = {
    memberships: list ?? [],
    fleetId,
    fleet: fleetReady ? fleetState!.fleet : null,
    member: fleetReady ? memberState!.member : null,
    noAccess: fleetReady && (fleetState!.denied || !memberState!.member),
    loading,
    setActiveFleet,
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error("useFleet must be used within a FleetProvider");
  }
  return context;
}
