import type { Metadata } from "next";

const DESCRIPTION =
  "Wrenchtron is a maintenance log for a household garage and a delivery fleet. Sign in with Google and start on your own.";

export const metadata: Metadata = {
  title: { absolute: "About Wrenchtron — a maintenance log for a garage or a fleet" },
  description: DESCRIPTION,
  alternates: { canonical: "https://wrenchtron.com/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
