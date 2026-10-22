import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center dark:bg-stone-950">
      <p className="text-sm text-stone-500 dark:text-stone-400">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-2 max-w-sm text-stone-600 dark:text-stone-300">
        The link may be old, or the page isn&apos;t built yet.
      </p>
      <div className="mt-6 flex gap-4 text-sm font-medium">
        <Link href="/" className="text-stone-900 underline underline-offset-4 dark:text-white">
          Home
        </Link>
        <Link href="/fleet" className="text-stone-900 underline underline-offset-4 dark:text-white">
          Your fleet
        </Link>
      </div>
    </div>
  );
}
