import type { Metadata } from "next";

const DESCRIPTION =
  "A sample maintenance log for a truck, a mower, and the rest of a household garage. The overdue work comes first. Start your own from the demo.";

export const metadata: Metadata = {
  title: { absolute: "Garage maintenance log demo — Wrenchtron" },
  description: DESCRIPTION,
  alternates: { canonical: "https://wrenchtron.com/demo" },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
