"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasFleetMembership } from "@/lib/firebase/fleet";
import { AREA_PATHS, rememberedArea } from "@/lib/homeArea";

/** Sends a signed-in person to their garage or fleet. Renders nothing, so the
 * landing page stays in the HTML a crawler saves. */
export function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    const area = rememberedArea();
    if (area) {
      router.replace(AREA_PATHS[area]);
      return;
    }
    hasFleetMembership(user.uid)
      .catch(() => false)
      .then((inFleet) => router.replace(inFleet ? "/fleet" : "/vehicles"));
  }, [user, loading, router]);

  return null;
}
