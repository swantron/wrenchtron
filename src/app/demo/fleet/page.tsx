import { Suspense } from "react";
import type { Metadata } from "next";
import { FleetDemo } from "@/components/fleet/FleetDemo";

const TITLE = "Wrenchtron for delivery fleets";
const DESCRIPTION = "Know what was done to every van, and see the proof: photo-verified maintenance across every site.";

export const metadata: Metadata = {
  title: "Fleet demo — Wrenchtron",
  description: DESCRIPTION,
  // What shows when the link is texted or posted
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/demo/fleet",
    siteName: "Wrenchtron",
    type: "website",
    images: [{ url: "/og/fleet-demo.png", width: 1200, height: 630, alt: "Wrenchtron fleet board with vans down, overdue, and due soon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/fleet-demo.png"],
  },
};

export default function FleetDemoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-gray-950 px-4 py-8">Loading...</div>}>
      <FleetDemo />
    </Suspense>
  );
}
