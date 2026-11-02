"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFleet } from "@/components/fleet/FleetProvider";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { signOut } from "@/lib/firebase/auth";
import { acceptInvite, getMyInvite } from "@/lib/firebase/fleet";
import type { FleetInvite } from "@/types/fleet";

const ROLE_WORDS = { manager: "a manager", tech: "a tech" } as const;

const buttonClass =
  "rounded bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200";

function JoinFleet() {
  const fleetId = useSearchParams().get("f") ?? "";
  const { user } = useAuth();
  const { memberships, loading: fleetLoading, setActiveFleet } = useFleet();
  const { showToast } = useToast();
  const router = useRouter();
  // Keyed so a lookup for a previous fleet or account never shows
  const [lookup, setLookup] = useState<{ key: string; invite: FleetInvite | null } | null>(null);
  const [joining, setJoining] = useState(false);

  const key = `${fleetId}:${user?.uid}`;
  // A pointer alone doesn't prove access: someone removed keeps theirs. So a
  // waiting invite wins, and "already in" is only said when there's none.
  const alreadyIn = memberships.some((m) => m.fleetId === fleetId);

  useEffect(() => {
    if (!user || !fleetId) return;
    let cancelled = false;
    getMyInvite(fleetId, user)
      .then((invite) => !cancelled && setLookup({ key: `${fleetId}:${user.uid}`, invite }))
      .catch((error) => {
        console.error("Failed to read invite:", error);
        if (!cancelled) setLookup({ key: `${fleetId}:${user.uid}`, invite: null });
      });
    return () => {
      cancelled = true;
    };
  }, [user, fleetId]);

  const openBoard = () => {
    setActiveFleet(fleetId);
    router.push("/fleet");
  };

  const join = async (invite: FleetInvite) => {
    if (!user) return;
    setJoining(true);
    try {
      await acceptInvite(user, fleetId, invite);
      showToast(`You've joined ${invite.fleetName || "the fleet"}.`, "success");
      openBoard();
    } catch (error) {
      console.error("Failed to accept invite:", error);
      showToast("Couldn't join. Ask whoever invited you to send a new invite.", "error");
      setJoining(false);
    }
  };

  if (!fleetId) {
    return (
      <Message title="This link is missing its fleet">
        Ask whoever invited you to send the join link again.
      </Message>
    );
  }

  if (fleetLoading || lookup?.key !== key) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  const invite = lookup.invite;

  if (!invite && alreadyIn) {
    const name = memberships.find((m) => m.fleetId === fleetId)?.fleetName;
    return (
      <Message title={`You're already in ${name || "this fleet"}`}>
        <button onClick={openBoard} className={`mt-6 ${buttonClass}`}>
          Go to the board
        </button>
      </Message>
    );
  }

  if (!invite) {
    return (
      <Message title="No invite for this account">
        You&apos;re signed in as <span className="font-medium text-stone-900 dark:text-white">{user?.email}</span>, and
        there&apos;s no invite waiting for that address. If the invite went to a different email, sign out and sign in
        with that one. Otherwise ask whoever invited you to check the address.
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button onClick={() => signOut()} className={buttonClass}>
            Sign out
          </button>
          <Link href="/fleet" className="text-sm text-stone-600 underline underline-offset-4 dark:text-stone-300">
            Back to the board
          </Link>
        </div>
      </Message>
    );
  }

  return (
    <Message title={`Join ${invite.fleetName || "the fleet"}`}>
      {invite.invitedByName ? `${invite.invitedByName} invited you` : "You've been invited"} as{" "}
      {ROLE_WORDS[invite.role]}. You&apos;ll see the fleet&apos;s vans and can log work on them from your phone.
      <div className="mt-6">
        <button onClick={() => join(invite)} disabled={joining} className={buttonClass}>
          {joining ? "Joining…" : "Join fleet"}
        </button>
      </div>
    </Message>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">{title}</h1>
      <div className="mt-2 text-stone-600 dark:text-stone-300">{children}</div>
    </div>
  );
}

export default function JoinFleetPage() {
  return (
    <Suspense>
      <JoinFleet />
    </Suspense>
  );
}
