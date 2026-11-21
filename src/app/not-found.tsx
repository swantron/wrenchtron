import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center dark:bg-stone-950">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
        That page isn&apos;t here
      </h1>
      <p className="mt-2 max-w-sm text-stone-600 dark:text-stone-300">
        The link may be old, or mistyped.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium">
        <Link href="/" className="inline-flex min-h-11 items-center text-stone-900 underline underline-offset-4 dark:text-white">
          Home
        </Link>
        <Link href="/demo" className="inline-flex min-h-11 items-center text-stone-900 underline underline-offset-4 dark:text-white">
          Garage demo
        </Link>
        <Link href="/demo/fleet" className="inline-flex min-h-11 items-center text-stone-900 underline underline-offset-4 dark:text-white">
          Fleet demo
        </Link>
      </div>
    </div>
  );
}
