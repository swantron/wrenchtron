import { Suspense } from "react";
import type { Metadata } from "next";
import { FleetDemo } from "@/components/fleet/FleetDemo";
import { FleetPitch } from "@/components/fleet/FleetPitch";

const TITLE = "Van maintenance log with photo proof — Wrenchtron";
const DESCRIPTION =
  "Know what was done to every van, and see the proof: photo-verified maintenance across every site. Try the sample fleet, or start your own.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://wrenchtron.com/demo/fleet" },
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
    <Suspense fallback={<div className="min-h-screen bg-stone-50 dark:bg-stone-950"><FleetPitch standalone /></div>}>
      <FleetDemo />
    </Suspense>
  );
}
