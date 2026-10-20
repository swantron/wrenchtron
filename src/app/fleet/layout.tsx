import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FleetProvider } from "@/components/fleet/FleetProvider";
import { FleetShell } from "@/components/fleet/FleetShell";

export const metadata: Metadata = {
  title: "Fleet — Wrenchtron",
};

export default function FleetLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <FleetProvider>
        <FleetShell>{children}</FleetShell>
      </FleetProvider>
    </ProtectedRoute>
  );
}
