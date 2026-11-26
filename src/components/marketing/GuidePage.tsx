import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/** Static, crawlable pages written for one search each. They link into the fleet demo. */

export const GUIDES = [
  { href: "/van-fleet-maintenance", label: "Delivery van fleets" },
  { href: "/fleet-maintenance-log", label: "Fleet maintenance log" },
  { href: "/van-damage-report", label: "Van damage reports" },
  { href: "/van-maintenance", label: "Van maintenance schedules" },
];

export function guideMetadata(path: string, title: string, description: string): Metadata {
  const url = `https://wrenchtron.com${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Wrenchtron",
      type: "article",
      images: [{ url: "/og/fleet-demo.png", width: 1200, height: 630, alt: "Wrenchtron fleet board" }],
    },
  };
}

export function GuidePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-gray-950">
      <header className="border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white">
            <Logo className="h-8 w-8" />
            Wrenchtron
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/demo/fleet"
              className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
        <article className="guide space-y-5 text-lg leading-relaxed text-gray-700 dark:text-gray-300">{children}</article>

        <section className="mt-14 rounded-2xl bg-blue-50 p-6 dark:bg-blue-900/20 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">See it on a sample fleet</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The demo is a made-up delivery company with vans that are down, overdue, and due soon. Tap a van to see
            every visit, with the photos. No sign-up, no call.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/demo/fleet"
              className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700"
            >
              Open the fleet demo
            </Link>
            <Link
              href="/login?next=/fleet/new"
              className="inline-flex min-h-11 items-center rounded-xl border border-gray-300 bg-white px-5 font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              Start a fleet
            </Link>
          </div>
        </section>
      </main>

      <GuideFooter />
    </div>
  );
}

export function GuideFooter() {
  return (
    <footer className="border-t border-gray-100 px-4 py-8 dark:border-gray-800 sm:px-8">
      <nav aria-label="Guides" className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-1 text-sm">
        {GUIDES.map((g) => (
          <Link key={g.href} href={g.href} className="inline-flex min-h-11 items-center text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white">
            {g.label}
          </Link>
        ))}
        <Link href="/about" className="inline-flex min-h-11 items-center text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white">
          About
        </Link>
      </nav>
    </footer>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">{children}</h1>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-6 text-2xl font-bold text-gray-900 dark:text-white">{children}</h2>;
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6">{children}</ul>;
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
      {children}
    </Link>
  );
}
