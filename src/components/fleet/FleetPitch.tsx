import Link from "next/link";

/** Static pitch for the fleet demo. Rendered in the server HTML, and again
 * inside the board once the sample vans are ready. */
export function FleetPitch({ standalone = false }: { standalone?: boolean }) {
  return (
    <div className={standalone ? "mx-auto max-w-6xl px-4 py-16 sm:px-6" : "mb-5 max-w-2xl sm:mb-8"}>
      {standalone && (
        <p className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">Wrenchtron</p>
      )}
      <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Demo Delivery Co. — sample vans, drawn photos</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-3xl">
        Know what was done to every van, and see the proof.
      </h1>
      <p className="mt-3 text-stone-600 dark:text-stone-300">
        Whoever does the work snaps the odometer, the part, and the invoice. You see it from one place, whether the
        van was serviced in the yard, at a partner shop, or by a mobile tech.
      </p>
      <p className="mt-3 text-stone-600 dark:text-stone-300">
        Paste your own vans and the schedule comes from the VIN. Your team logs the work, with photos, from their
        phones. Try the sample first, or start a fleet on your own.
      </p>
      {standalone && (
        <Link
          href="/login?next=/fleet/new"
          className="mt-6 inline-flex min-h-11 items-center rounded bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900"
        >
          Start a fleet
        </Link>
      )}
    </div>
  );
}
