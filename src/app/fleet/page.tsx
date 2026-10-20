"use client";

import Link from "next/link";
import { useFleet } from "@/components/fleet/FleetProvider";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PLAN_LABELS = { pilot: "Pilot", active: "Active", lapsed: "Lapsed" } as const;

export default function FleetPage() {
  const { fleet, member, memberships, noAccess, loading } = useFleet();

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">You&apos;re not in a fleet yet</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-300">
          If someone invited you, open the link they sent and sign in with the same email. Otherwise, set up a fleet
          for your company.
        </p>
        <Link
          href="/fleet/new"
          className="mt-6 inline-block rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
        >
          Set up a fleet
        </Link>
      </div>
    );
  }

  if (noAccess || !fleet || !member) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">No access to this fleet</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-300">
          You may have been removed from it. Ask the fleet&apos;s owner to invite you again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        {fleet.plan ? `${PLAN_LABELS[fleet.plan.status]} plan` : "Not activated yet"}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-3xl">
        {fleet.name}
      </h1>

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-y border-stone-200 py-4 text-sm dark:border-stone-800">
        <div>
          <dt className="text-stone-500 dark:text-stone-400">Sites</dt>
          <dd className="font-medium text-stone-900 dark:text-white">
            {fleet.sites.length ? fleet.sites.map((s) => s.name).join(", ") : "None yet"}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500 dark:text-stone-400">Vans</dt>
          <dd className="font-medium text-stone-900 dark:text-white">0</dd>
        </div>
      </dl>

      <div className="mt-10 max-w-lg">
        <h2 className="font-semibold text-stone-900 dark:text-white">No vans yet</h2>
        <p className="mt-1 text-stone-600 dark:text-stone-300">
          VIN import, inviting your techs, and the service board are on the way. The board will look like the{" "}
          <Link href="/demo/fleet" className="underline underline-offset-4">
            fleet demo
          </Link>
          , with your vans in it.
        </p>
      </div>
    </div>
  );
}
