import { Suspense } from "react";
import type { Metadata } from "next";
import { FleetDemo } from "@/components/fleet/FleetDemo";

export const metadata: Metadata = {
  title: "Fleet demo — Wrenchtron",
  description: "Photo-verified maintenance for delivery fleets across multiple locations.",
};

export default function FleetDemoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-gray-950 px-4 py-8">Loading...</div>}>
      <FleetDemo />
    </Suspense>
  );
}
