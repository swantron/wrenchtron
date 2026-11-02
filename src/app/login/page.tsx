"use client";

import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import { completeEmailLinkSignIn, isEmailSignInLink, sendSignInLink, storedSignInEmail } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";

/** Only same-site paths — never an open redirect to another host. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/vehicles";
}

function readNext(): string {
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}

const subscribeNoop = () => () => {};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white";
const submitClass =
  "w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200";

function linkErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
    return "That link has expired or was already used. Send yourself a new one.";
  }
  if (code === "auth/invalid-email") return "That isn't the address the link was sent to.";
  return "Couldn't sign you in. Please try again.";
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Client-only facts about the URL; the static prerender sees neither.
  const isLink = useSyncExternalStore(subscribeNoop, () => isEmailSignInLink(window.location.href), () => false);
  const joining = useSyncExternalStore(subscribeNoop, () => readNext().startsWith("/fleet/join"), () => false);

  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTried = useRef(false);

  useEffect(() => {
    if (!loading && user) router.push(readNext());
  }, [user, loading, router]);

  const finish = async (address: string) => {
    setBusy(true);
    setError(null);
    try {
      await completeEmailLinkSignIn(address.trim(), window.location.href);
      // The auth listener above redirects once the user is set
    } catch (err) {
      console.error("Email link sign-in failed:", err);
      setError(linkErrorMessage(err));
      setBusy(false);
    }
  };

  // Opened on the device that asked for the link: finish without asking again
  const autoEmail = useSyncExternalStore(subscribeNoop, () => (isLink ? storedSignInEmail() : null), () => null);
  useEffect(() => {
    if (!autoEmail || autoTried.current) return;
    autoTried.current = true;
    completeEmailLinkSignIn(autoEmail, window.location.href).catch((err) => {
      console.error("Email link sign-in failed:", err);
      setError(linkErrorMessage(err));
    });
  }, [autoEmail]);
  const signingIn = busy || (!!autoEmail && !error) || !!user;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      await sendSignInLink(address, readNext());
      setSentTo(address);
    } catch (err) {
      console.error("Sending sign-in link failed:", err);
      const code = (err as { code?: string })?.code;
      setError(code === "auth/invalid-email" ? "That doesn't look like an email address." : "Couldn't send the link. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (isLink) {
    body = (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) void finish(email);
        }}
        className="space-y-3"
      >
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          {signingIn ? "Signing you in…" : "Confirm the email address the link was sent to."}
        </p>
        {!signingIn && (
          <>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className={inputClass}
            />
            <button type="submit" className={submitClass}>
              Sign in
            </button>
          </>
        )}
        {!signingIn && error && (
          <button
            type="button"
            onClick={() => window.location.assign(`/login?next=${encodeURIComponent(readNext())}`)}
            className="block w-full text-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
          >
            Send a new link instead
          </button>
        )}
      </form>
    );
  } else if (sentTo) {
    body = (
      <div className="space-y-3 text-center text-sm text-gray-600 dark:text-gray-300">
        <p>
          We sent a sign-in link to <span className="font-medium text-gray-900 dark:text-white">{sentTo}</span>. Open it on
          this device to finish.
        </p>
        <p className="text-gray-500 dark:text-gray-400">Not there? Check spam, or</p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
        >
          use a different email
        </button>
      </div>
    );
  } else {
    body = (
      <div className="space-y-6">
        <div className="flex justify-center">
          <LoginButton />
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          or
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>
        <form onSubmit={send} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email me a sign-in link</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className={inputClass}
            />
          </label>
          <button type="submit" disabled={busy || !email.trim()} className={submitClass}>
            {busy ? "Sending…" : "Send link"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6 dark:bg-gray-950">
      <div className="relative mb-12 flex flex-col items-center text-center">
        <div className="absolute -inset-4 rounded-full bg-blue-500/10 blur-2xl" />
        <Link href="/" className="relative text-5xl font-black tracking-tight text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition-colors sm:text-7xl">
          Wrenchtron
        </Link>
      </div>

      <div className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">Sign In</p>
          <p className="mt-1 text-balance text-sm text-gray-500 dark:text-gray-400">
            {joining
              ? "Use the email address your invite was sent to"
              : "Your vehicles, service history, and what’s due next"}
          </p>
        </div>
        {body}
        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
